# Profile Redesign — Design Spec

**Date:** 2026-06-25  
**Status:** Approved

---

## Goal

Refonte complète de la vue profil `app/(tabs)/profile.tsx` pour correspondre au nouveau mockup : section hero avatar + infos loup, suivie de deux lignes d'accessoires (Antre/Cri puis Meute/Totem) avec noms par niveau et barres de progression.

---

## Layout général

```
┌─────────────────────────────────────────────┐
│  Life XP                        ☀/🌙        │  ← Header
├─────────────────────────────────────────────┤
│  [Avatar]   Nom du loup                     │
│  120×120    Classe (ex. Louveteau…)         │  ← Hero section
│             ★★☆☆☆☆☆☆☆☆  (1-10 étoiles)    │
│             Expérience : 347 XP             │
│             "mantra aléatoire…"             │
│             Prochain classe : Éveil…        │
│             Pour niv. suiv. : Antre niv2    │
├─────────────────────────────────────────────┤
│  [Antre]          │  [Cri]                  │
│  Tanière des C.   │  Souffle Muet           │  ← Ligne 1 accessoires
│  ░░░████████░░░   │  ░░████░░░░░░           │
├─────────────────────────────────────────────┤
│  [Meute]          │  [Totem]                │
│  Loup Solitaire   │  Pierre Brute           │  ← Ligne 2 accessoires
│  ░░░░░███████░░   │  ░░░░░░░░████           │
└─────────────────────────────────────────────┘
```

---

## Section hero

### Sous-layout
`flexDirection: 'row'` — avatar à gauche (120×120), colonne info à droite (flex: 1).

### Éléments de la colonne droite

| Élément | Source | Détail |
|---|---|---|
| Nom du loup | `profiles.wolf_name` | Tap → modal d'édition |
| Classe | `getWolfClass(avatarScore)` | 10 titres dans `wolf-data.ts` |
| Étoiles | index 1–10 du tier | Caractères ★ / ☆ Unicode, 10 caractères |
| Expérience | Calculé (voir ci-dessous) | Affichage : `"347 XP"` |
| Mantra | `getRandomMantra(tierIndex)` | 3 phrases par classe dans `wolf-data.ts` |
| Prochain classe | Titre suivant dans le tableau | `"—"` si tier 10 |
| Pour prochain niveau | `getNextLevelText(levels)` | Texte court, ex. `"Antre niv2, Cri niv2"` |

### Calcul de l'expérience totale

```
XP = Σ (sur les 4 catégories) [
  sum(scoring_config.points_to_next_level pour niveaux 1..current_level-1)
  + points_in_level
]
```

Calculé depuis les données déjà chargées (`scoringConfigs` + `progress`). Pas de nouveau champ DB.

### Modal d'édition du nom
- `Modal` React Native, centré, fond semi-transparent
- `TextInput` pré-rempli avec le nom actuel
- Bouton "Sauvegarder" → `saveWolfName(name)` → ferme le modal
- Validation : non vide, max 30 caractères

---

## Grille accessoires

### Structure
Deux `View` en `flexDirection: 'row'` séparées par un `View` divider horizontal. Chaque cellule = 50% width, séparateur vertical entre les deux cellules d'une même ligne.

### Contenu de chaque cellule
1. `AccessoryIcon` (composant existant, taille 64)
2. Nom de l'accessoire selon le niveau courant (voir table ci-dessous)
3. Barre de progression vers le niveau suivant (existante, conservée)

### Noms des accessoires par niveau

| Niveau | Antre (self_care) | Cri (dev_perso) | Meute (vie_familiale) | Totem (vie_pro) |
|---|---|---|---|---|
| 1 | Tanière des Cendres | Souffle Muet | Loup Solitaire | Pierre Brute |
| 2 | Antre des Racines | Grondement des Plaines | Duo des Lisières | Stèle Gravée |
| 3 | Refuge des Forêts | Rugissement Doré | Meute des Clairières | Totem Éveillé |
| 4 | Sanctuaire des Profondeurs | Hurlement des Vagues | Meute des Territoires | Totem Ardent |
| 5 | Caverne des Cristaux | Chant des Origines | Légion des Ombres | Totem Divin |

---

## Données wolf — `lib/wolf-data.ts`

### Classes (10 tiers)

```
Tier 1  → score ≤ 5   → "Louveteau des Cendres"
Tier 2  → score ≤ 15  → "Éveil des Frimas"
Tier 3  → score ≤ 25  → "Rôdeur des Lisières"
Tier 4  → score ≤ 35  → "Traqueur des Herbes"
Tier 5  → score ≤ 45  → "Chasseur des Brumes"
Tier 6  → score ≤ 55  → "Gardien des Clairières"
Tier 7  → score ≤ 65  → "Seigneur des Territoires"
Tier 8  → score ≤ 75  → "Loup-Totem"
Tier 9  → score ≤ 85  → "Esprit de la Meute"
Tier 10 → score ≤ 95  → "Loup Dieu des Origines"
```

### Mantras (3 par tier)

```
Tier 1 : "Chaque jour est un premier pas." / "Le feu commence par une étincelle." / "Dormir, c'est déjà survivre."
Tier 2 : "J'ouvre les yeux sur ce que je peux devenir." / "Le froid réveille." / "Je sens le monde pour la première fois."
Tier 3 : "Je n'appartiens pas encore à la forêt, mais je l'approche." / "Chaque lisière franchie est une victoire." / "Je rôde, donc j'existe."
Tier 4 : "Je suis patient. La proie vient à qui sait attendre." / "Mes pattes connaissent le chemin." / "Je trace ma route dans l'herbe haute."
Tier 5 : "La brume ne me cache plus, elle me protège." / "Je chasse ce qui me rend plus fort." / "L'effort d'aujourd'hui nourrit demain."
Tier 6 : "Je protège ce qui compte." / "La clairière est à moi parce que je l'ai méritée." / "Garder, c'est aussi grandir."
Tier 7 : "Mon territoire est le reflet de ma discipline." / "Je n'occupe pas l'espace, je le mérite." / "Chaque habitude est une frontière que j'étends."
Tier 8 : "Je suis devenu ce que je pratique." / "Ma légende s'écrit chaque matin." / "Les autres voient le résultat. Je connais le chemin."
Tier 9 : "Je ne cours plus pour moi seul." / "Mon énergie rayonne sur ceux qui m'entourent." / "L'esprit ne vieillit pas. Il s'affine."
Tier 10: "Je suis l'origine et l'aboutissement." / "Rien ne commence sans effort. Rien ne s'arrête sans raison." / "Je suis la preuve que c'est possible."
```

### `getNextLevelText(levels: CategoryLevels): string`

Lit les niveaux actuels, identifie le prochain palier `avatarScore` à atteindre (depuis `avatar-level.ts`), retourne une description lisible des accessoires à faire monter.

Exemples :
- Score 5 (tout niveau 1) → `"Antre niv2"` (un seul suffit pour aller à tier 2)
- Score 15 (1 cat niveau 2) → `"Cri niv2"` (une deuxième cat à niv2 pour tier 3)
- Score max → `"—"`

---

## Backend

### Migration Supabase

Nouveau fichier : `supabase/migrations/YYYYMMDDHHMMSS_create_profiles.sql`

```sql
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wolf_name text not null default 'Loup Sans Nom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can upsert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);
```

### `lib/profiles.ts`

```ts
fetchWolfName(): Promise<string>   // SELECT wolf_name FROM profiles WHERE user_id = auth.uid()
saveWolfName(name: string): Promise<void>  // UPSERT profiles(user_id, wolf_name)
```

---

## Fichiers modifiés / créés

| Fichier | Action |
|---|---|
| `app/(tabs)/profile.tsx` | Réécriture complète du JSX, nouveaux styles |
| `lib/wolf-data.ts` | Nouveau — classes, mantras, noms accessoires, `getNextLevelText` |
| `lib/profiles.ts` | Nouveau — `fetchWolfName`, `saveWolfName` |
| `supabase/migrations/*_create_profiles.sql` | Nouveau — table profiles + RLS |

Aucun autre fichier touché. `accessory-icon.tsx`, `avatar/`, `scoring-config.ts`, `category-progress.ts` restent inchangés.

---

## Hors scope

- Édition d'autres champs de profil (avatar, email…)
- Historique des noms
- Affichage du nom dans d'autres vues
