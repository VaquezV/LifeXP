# LifeXP — Descente de niveau + notifications d'accessoires

**Date :** 2026-08-16
**Statut :** Approuvé, prêt pour implémentation

---

## Contexte

Le système de points par niveau (`category_progress`, edge function `apply-daily-scoring`, voir [2026-06-24-point-system-redesign-design.md](2026-06-24-point-system-redesign-design.md)) ne permet aujourd'hui aucune décroissance : `points_in_level` est clampé à 0 minimum, le niveau ne baisse jamais, et le niveau 5 (max) est totalement exclu du calcul quotidien.

Cette feature ajoute :
1. Une vraie décroissance de niveau quand `points_in_level` devient négatif (abandon prolongé d'une catégorie).
2. Une notification (modal) quand un ou plusieurs accessoires sont gagnés ou perdus suite à ce recalcul quotidien.

---

## 1. Descente de niveau (edge function `apply-daily-scoring`)

### 1.1 Config utilisée par niveau

Le lookup de config passe de `configs[currentLevel + 1]` à `configs[Math.min(currentLevel + 1, 5)]`, pour que le niveau 5 (max) réutilise sa propre config (`configs[5]`) au lieu de sauter le calcul. Le niveau 5 n'est donc plus exclu (suppression du `if (currentLevel >= 5) continue`) : il continue d'accumuler/perdre des points avec `daily_maintenance` et `points_to_next_level` de `configs[5]`, mais ne peut jamais dépasser le niveau 5 (le level-up reste gardé par `currentLevel < 5`).

### 1.2 Algorithme (remplace les lignes 123-131 actuelles)

```
net = pts_today - config.daily_maintenance
pointsInLevel = pointsInLevel + net

si pointsInLevel < 0 ET currentLevel > 0 :
    newLevel = currentLevel - 1
    capNewLevel = configs[Math.min(newLevel + 1, 5)].points_to_next_level
    pointsInLevel = round(0.75 * capNewLevel)
sinon :
    pointsInLevel = max(0, pointsInLevel)   // niveau 0 = plancher, pas de niveau -1
    si pointsInLevel >= config.points_to_next_level ET currentLevel < 5 :
        pointsInLevel -= config.points_to_next_level
        newLevel = currentLevel + 1
```

**Exemple :** catégorie au niveau 4, `points_in_level` proche de 0, plusieurs jours sans activité → `net` négatif fait passer `pointsInLevel` sous 0 → `newLevel = 3`, cap du niveau 3 = `configs[4].points_to_next_level` (110 dans le fallback actuel) → `pointsInLevel = round(0.75 * 110) = 83`.

### 1.3 Invariants mis à jour

- Niveau 0 = plancher absolu (jamais de niveau -1), `points_in_level` clampé à 0 dans ce cas.
- Niveau 5 = plafond absolu (jamais de niveau 6), mais **peut désormais redescendre à 4** si `points_in_level` devient négatif.
- Le niveau ne peut varier que de ±1 par exécution de l'edge function (une seule fenêtre de maintenance est traitée par jour, anti-doublon `last_maintenance_date` inchangé).

---

## 2. Trigger SQL `validate_category_level_progression`

Actuellement seule la hausse est bornée à +1. Étendre la même contrainte à la baisse :

```sql
if new.current_level != old.current_level then
  if abs(new.current_level - old.current_level) > 1 then
    raise exception 'Category levels must progress sequentially: cannot jump from level % to level %', old.current_level, new.current_level;
  end if;
end if;
```

---

## 3. Détection des accessoires gagnés/perdus (client)

Les accessoires ne sont pas persistés : `getUnlockedElements(category, level, pointsInLevel, pointsToNextLevel)` (`lib/category-elements.ts`) les recalcule à la volée depuis `category_progress`. On réutilise cette fonction pure existante plutôt que de dupliquer la logique côté edge function Deno.

### 3.1 Schéma

Ajout de deux colonnes sur `category_progress` :

```sql
alter table public.category_progress
  add column last_seen_level int not null default 1,
  add column last_seen_points_in_level float not null default 0;
```

Seedées à la valeur courante de `current_level`/`points_in_level` pour les lignes existantes (pas de faux "gain" au premier lancement post-migration).

### 3.2 Calcul du diff (au chargement de l'app, `app/_layout.tsx`)

Pour chaque catégorie de `category_progress` :

```
unlockedBefore = getUnlockedElements(category, last_seen_level, last_seen_points_in_level, config[last_seen_level].points_to_next_level)
unlockedAfter  = getUnlockedElements(category, current_level, points_in_level, config[current_level].points_to_next_level)

gained = unlockedAfter  - unlockedBefore  (par id)
lost   = unlockedBefore - unlockedAfter   (par id)
```

Si `current_level !== last_seen_level`, le lookup d'éléments par niveau change aussi de bucket dans `CATEGORY_ELEMENTS_CONFIG` — la comparaison se fait bien par `id` d'élément (uniques inter-niveaux), donc un changement de niveau est naturellement capturé comme gain/perte d'éléments.

### 3.3 Mise à jour du "seen"

Après fermeture du/des modal(aux) d'accessoires (voir §4), update `last_seen_level = current_level, last_seen_points_in_level = points_in_level` pour chaque catégorie concernée — même pattern que `handleCelebrationComplete` existant pour `last_seen_wolf_level`.

---

## 4. Modals

Deux nouveaux composants, calqués sur `CelebrationModal` (mêmes primitives visuelles/animation) :

- **`AccessoryGainedModal`** — liste groupée de tous les accessoires gagnés (toutes catégories confondues) depuis le dernier "seen", avec une phrase motivante piochée aléatoirement dans `ACCESSORY_GAINED_QUOTES`.
- **`AccessoryLostModal`** — même principe pour les accessoires perdus, phrase piochée dans `ACCESSORY_LOST_QUOTES`.

Un accessoire perdu n'est pas supprimé de l'UI : il redevient simplement verrouillé/grisé (état déjà géré par `getLockedElements`), comme un palier jamais atteint.

### 4.1 Ordre d'affichage

Dans `app/_layout.tsx`, à la suite de la vérification `checkLevelChange` existante :

1. Si `gained.length > 0` → `AccessoryGainedModal`
2. Si `lost.length > 0` → `AccessoryLostModal`
3. Puis `CelebrationModal` (niveau loup) si applicable, comme aujourd'hui

Chaque modal est fermé (bouton "Continuer") avant l'affichage du suivant — pas de superposition.

---

## 5. Phrases motivantes

Nouveau fichier `lib/accessory-quotes.ts` :

```ts
export const ACCESSORY_GAINED_QUOTES: readonly string[] = [ /* 50 phrases */ ];
export const ACCESSORY_LOST_QUOTES: readonly string[] = [ /* 50 phrases */ ];
```

Ton calqué sur `WOLF_QUOTES` (`lib/accessoires.ts`) et `WOLF_MANTRAS` (`lib/wolf-data.ts`) : français, métaphore loup/forêt/meute, phrases courtes. Les phrases de perte restent bienveillantes/encourageantes (pas culpabilisantes) : elles annoncent la perte sans décourager la reprise.

---

## 6. Fichiers impactés

### Nouveaux
- `supabase/migrations/<timestamp>_category_level_decay.sql` — extension trigger + colonnes `last_seen_level`/`last_seen_points_in_level`
- `components/accessory-gained-modal.tsx`
- `components/accessory-lost-modal.tsx`
- `lib/accessory-quotes.ts`

### Modifiés
- `supabase/functions/apply-daily-scoring/index.ts` — logique de décroissance, niveau 5 non exclu
- `app/_layout.tsx` — diff accessoires + orchestration des modals
- `lib/scoring-fallback.ts` / `lib/scoring-config.ts` — inchangés (valeurs déjà présentes pour tous les niveaux 1-5)
