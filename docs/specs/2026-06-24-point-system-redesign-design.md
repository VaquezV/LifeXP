# LifeXP — Refonte système de points, niveaux et avatar

**Date :** 2026-06-24
**Statut :** Approuvé, prêt pour implémentation

---

## Contexte

Le système EMA/momentum (`category_momentum`) est remplacé par un système de points par niveau, persisté en DB, avec maintenance journalière et configuration stockée en base. L'avatar du loup est redérivé depuis les niveaux des catégories (plus depuis le weekly score %). Tous les affichages de pourcentages sont supprimés.

---

## 1. Schéma DB

### 1.1 Table supprimée

`category_momentum` est droppée entièrement (remplacée par `category_progress`).

### 1.2 Nouvelle table : `scoring_config`

Configuration par niveau, lecture seule pour les utilisateurs authentifiés. Seedée avec les valeurs du spec.

```sql
create table public.scoring_config (
  level                int primary key check (level between 1 and 5),
  max_habits           int not null,
  min_completion_pct   int not null,
  pts_scale            jsonb not null,
  daily_maintenance    float not null,
  points_to_next_level int not null
);
```

**Colonnes :**
- `level` — N1 à N5
- `max_habits` — nombre maximum d'habitudes dans la catégorie à ce niveau
- `min_completion_pct` — seuil de complétion minimum pour gagner des points
- `pts_scale` — barème JSON : `[{"pct": 80, "pts": 1}, {"pct": 85, "pts": 2}, ...]`
- `daily_maintenance` — points déduits chaque nuit
- `points_to_next_level` — points nécessaires pour passer au niveau suivant (consommés au level-up)

**Seed (valeurs du spec) :**

| level | max_habits | min_completion_pct | daily_maintenance | points_to_next_level |
| ----- | ---------- | ------------------ | ----------------- | -------------------- |
| 1     | 2          | 80                 | 1                 | 50                   |
| 2     | 3          | 82                 | 2                 | 65                   |
| 3     | 4          | 84                 | 4.0               | 85                   |
| 4     | 5          | 86                 | 7                 | 110                  |
| 5     | 5          | 95                 | 10.0              | 140                  |

**pts_scale par niveau :**
- N1 : `[{pct:80,pts:1},{pct:85,pts:2},{pct:90,pts:3},{pct:95,pts:4},{pct:100,pts:5}]`
- N2 : `[{pct:82,pts:1},{pct:87,pts:2},{pct:92,pts:3},{pct:97,pts:4},{pct:100,pts:5}]`
- N3 : `[{pct:84,pts:1},{pct:89,pts:2},{pct:94,pts:3},{pct:99,pts:4},{pct:100,pts:5}]`
- N4 : `[{pct:86,pts:1},{pct:91,pts:2},{pct:96,pts:3},{pct:99,pts:4},{pct:100,pts:5}]`
- N5 : `[{pct:95,pts:1},{pct:96pts:2},{pct:91,pts:3,{pct:100,pts:5}]`

RLS : select ouvert à `authenticated`, pas d'insert/update/delete pour les users.

### 1.3 Nouvelle table : `category_progress`

Une ligne par user × catégorie.

```sql
create table public.category_progress (
  user_id              uuid not null references auth.users(id) on delete cascade,
  category             text not null check (category in ('self_care','dev_perso','vie_familiale','vie_pro')),
  current_level        int not null default 1 check (current_level between 1 and 5),
  points_in_level      float not null default 0,
  last_maintenance_date date,
  updated_at           timestamptz not null default now(),
  constraint category_progress_pkey primary key (user_id, category)
);
```

RLS : chaque user lit et écrit uniquement ses propres lignes. `service_role` a accès total (pour l'edge function).

---

## 2. Logique de scoring (edge function — minuit UTC)

L'edge function `update-momentum` est renommée/remplacée par `apply-daily-scoring`.

### 2.1 Algorithme par user × catégorie

```
1. Charger scoring_config pour tous les niveaux
2. Charger category_progress[user][category] (ou initialiser N1, 0pts)
3. Vérifier last_maintenance_date : si = today → skip (anti-doublon)
4. Charger les habitudes de la catégorie
5. Charger les logs des 7 derniers jours
6. Pour chaque habitude :
   a. Calculer rolling 7-day completion % (logique calculateWeeklyScore existante)
   b. Appliquer pts_scale du current_level → pts_habit (0 si < min_completion_pct)
7. pts_today = sum(pts_habit pour toutes les habitudes)
8. net = pts_today - daily_maintenance[current_level]
9. points_in_level = max(0, points_in_level + net)
10. Si points_in_level >= points_to_next_level ET current_level < 5 :
    points_in_level -= points_to_next_level
    current_level += 1
11. Upsert category_progress avec les nouvelles valeurs + last_maintenance_date = today
```

### 2.2 Invariants
- `points_in_level` ne peut jamais descendre sous 0 (floor explicite)
- Le niveau ne peut jamais diminuer (seul le level-up est possible, jamais de descente)
- L'anti-doublon `last_maintenance_date` prévient une double-déduction si la cron tourne deux fois

---

## 3. Noms de devise par catégorie

| catégorie       | devise      |
| --------------- | ----------- |
| `self_care`     | Paille      |
| `dev_perso`     | Souffle     |
| `vie_familiale` | Interaction |
| `vie_pro`       | Influence   |

Stocké dans une constante TS `CATEGORY_CURRENCY_NAMES`.

---

## 4. Accessoire — tier et overlay

### 4.1 Tier de l'image SVG
Le tier (0-4) est directement dérivé du niveau courant :
```
accessory_tier = current_level - 1
```
Plus de mapping depuis un pourcentage.

### 4.2 Overlay height (page check-in)
Progression vers le niveau suivant :
```
overlay_height = 1 - (points_in_level / points_to_next_level)
```
0 = accessoire entièrement visible, 1 = accessoire caché.

---

## 5. Avatar loup

### 5.1 Fonction `getAvatarScoreFromLevels`

Remplace `getAvatarByScore(weeklyScore)`. Prend les 4 niveaux de catégorie en entrée.

**Évaluation du plus élevé au plus bas — premier match retourné.** "≥ X cats à Ny" = au moins X catégories avec `current_level >= y`.

| Condition | Score avatar |
| --------- | ------------ |
| Les 4 catégories à N5            | 95           |
| ≥ 2 à N4 + ≥ 2 à N5              | 85           |
| Les 4 catégories à N4            | 75           |
| ≥ 2 à N3 + ≥ 2 à N4              | 65           |
| Les 4 catégories à N3            | 55           |
| ≥ 2 à N2 + ≥ 2 à N3              | 45           |
| Les 4 catégories à N2            | 35           |
| ≥ 2 catégories à N2              | 25           |
| ≥ 1 catégorie à N2               | 15           |
| (défaut — toutes N1)             | 5            |

Les fichiers SVG existants (`got.0-10.svg` → `got.91-100.svg`) sont utilisés tels quels.

---

## 6. Limite d'habitudes par niveau

### 6.1 Règle
Lors de l'ajout d'une habitude dans une catégorie X :
- Compter les habitudes existantes dans la catégorie
- Comparer à `scoring_config[current_level].max_habits`

### 6.2 UX — bouton `+` par catégorie

Le bouton global "Ajouter une nouvelle habitude" en bas de page est **supprimé**.

Chaque `CategorySection` a un bouton `+` dans son header (à droite du titre).

| Situation                              | Apparence bouton                                          | Action au tap                                                 |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Slots disponibles (count < max_habits) | `+` actif, légère animation pulse couleur accent          | Ouvre `AddHabitModal` filtré sur la catégorie                 |
| Limite atteinte (count = max_habits)   | `+` actif, style "bloqué" (opacity réduite ou icône lock) | Toast : *"Niveau [N+1] requis"* si `current_level < 5`, sinon *"Niveau maximum atteint"* |

---

## 7. Suppressions UI

### 7.1 `CategorySection`
- **Supprimé :** barre de progression, texte `{completionPct}%`
- **Ajouté :** `"37 points de Paille · N2 · Palier 3/5"`

### 7.2 Profile — grille 2×2
- **Supprimé :** barre de progression, `{pct}%`
- **Ajouté :** `"37 pts de Paille"` + `"N2 · Palier 3/5"`

### 7.3 Profile — zone avatar
- **Supprimé :** label `"Semaine en cours"`, `{weeklyScore}%`, barre XP
- **Ajouté :** `"Loup · N[x]"` où N[x] est le niveau loup dérivé des catégories

### 7.4 HeroBanner
- **Supprimé :** affichage `weeklyScore`

---

## 8. Fichiers impactés

### Nouveaux
- `supabase/migrations/20260624_add_scoring_system.sql` — drop momentum, create scoring_config + category_progress, seed config
- `supabase/functions/apply-daily-scoring/index.ts` — remplace update-momentum
- `lib/scoring-config.ts` — types + helpers pour lire scoring_config
- `lib/category-progress.ts` — CRUD category_progress depuis le client
- `lib/avatar-level.ts` — `getAvatarScoreFromLevels()`

### Modifiés
- `lib/accessoires.ts` — `getAccessoryTierIndex` depuis level (pas pct), overlay depuis points_in_level
- `lib/avatars/config.ts` — `getAvatarByScore` utilisé avec le nouveau score loup
- `lib/types.ts` — nouveaux types `CategoryProgress`, `ScoringConfig`
- `components/category-section.tsx` — bouton `+` dans header, suppression barre/pct, affichage points+niveau
- `app/(tabs)/index.tsx` — charge `category_progress`, supprime `categoryCompletions` pour l'UI
- `app/(tabs)/profile.tsx` — grille sans pct, zone avatar sans XP bar
- `components/hero-banner.tsx` — supprime weeklyScore

### Supprimés
- `lib/momentum-db.ts` — plus utilisé
- `lib/momentum.ts` — plus utilisé (ou conservé partiellement si overlay logic réutilisée)
