# Refonte "Profil" → "Sanctuaire" + sous-système d'éléments visuels de progression

## Contexte

La page actuellement nommée "Profil" (`app/(tabs)/profile.tsx`) devient "Sanctuaire". Elle reste centrée sur le loup (tier global, progression vers le prochain tier) et sur les 4 catégories (Antre/self_care, Cri/dev_perso, Meute/vie_familiale, Totem/vie_pro), mais rend la progression *tangible* : au lieu d'un simple pourcentage, chaque catégorie affiche des éléments visuels débloqués progressivement à l'intérieur du niveau courant.

Ce document ne modifie **aucune règle métier existante** : ni le calcul du score du loup (`getAvatarScoreFromLevels`), ni le mapping score→tier (`getWolfTierIndex`/`getWolfClass`), ni le moteur de scoring quotidien (`apply-daily-scoring`), ni les seuils de niveau (`scoring_config`). Il ajoute uniquement une couche de dérivation visuelle au-dessus des données existantes.

## Rappel du système existant (ne pas modifier)

- **Source de vérité des points** : table `category_progress` (`user_id`, `category`, `current_level` 1-5, `points_in_level`), recalculée chaque nuit par l'edge function `apply-daily-scoring`. Un trigger SQL (`validate_category_level_progression`) empêche de sauter un niveau.
- **Coût par niveau** : `scoring_config.points_to_next_level` (5 lignes fixes, fallback TS `SCORING_CONFIG_FALLBACK`).
- **Score du loup** : `getAvatarScoreFromLevels` (`lib/avatar-level.ts`) — dérivé combinatoire des 4 niveaux de catégorie (pas une moyenne). Ex : une seule catégorie à N2 suffit à monter le loup d'un cran ; le tier maximal exige les 4 catégories à N5.
- **Tier/classe du loup** : `getWolfTierIndex`/`getWolfClass` (`lib/wolf-data.ts`), déclenchement de `CelebrationModal` via comparaison `current_wolf_level`/`last_seen_wolf_level` (table `user_palette_progression`).
- **Noms narratifs** : `ACCESSORY_LABELS` (Antre/Cri/Meute/Totem), `CATEGORY_CURRENCY_NAMES`, `getAccessoryName` par niveau (`lib/accessoires.ts`, `lib/wolf-data.ts`) — réutilisés tels quels.

Aucun de ces fichiers n'est modifié par ce travail.

## Renommage

- Tab bar : `app/(tabs)/_layout.tsx:30` → `title: 'Sanctuaire'` (le libellé de navigation change en cohérence avec le header de page).
- Fichier de route et nom de fichier (`profile.tsx`, `name="profile"`) **inchangés** — pas de risque sur la navigation/les deep-links.
- Header interne de la page (actuellement "Profil") devient "Sanctuaire".
- Aucun renommage de catégorie en base ou dans le code métier (les clés `CategoryType` restent `self_care`/`dev_perso`/`vie_familiale`/`vie_pro`).

## Nouveau sous-système : éléments visuels de progression

### Principe

Chaque niveau de catégorie contient N éléments (N = niveau visé : 1 élément au niveau 1, jusqu'à 5 au niveau 5, dont respectivement la rune I/II/III aux niveaux 3/4/5). Ces éléments ne sont **ni une monnaie, ni une table, ni un inventaire** : ils sont entièrement dérivés de `current_level` + `points_in_level` + `points_to_next_level`.

### Formule des seuils

Pour un palier de coût `C` (= `points_to_next_level` du niveau courant) et `N` éléments :

```ts
function getElementThresholds(costToNextLevel: number, elementCount: number): number[] {
  const n = elementCount + 1;
  return Array.from({ length: elementCount }, (_, i) =>
    Math.ceil(((i + 1) * costToNextLevel) / n)
  );
}
```

Propriétés garanties par construction : séquence strictement croissante, dernier seuil toujours `< costToNextLevel` (un dernier segment de progression subsiste avant le niveau suivant), fonctionne pour `costToNextLevel = 0` et pour `elementCount` de 1 à 5.

Exemples de référence (utilisés tels quels dans les tests) :
- `C=75, N=2` → `[25, 50]`
- `C=100, N=4` → `[20, 40, 60, 80]`
- `C=50, N=3` → `[13, 25, 38]`

### Cas limites

- **Niveau 5 (max)** : le moteur de scoring ne plafonne pas `points_in_level` au-delà de `points_to_next_level` (il continue de s'accumuler tant que `current_level < 5` reste faux). Décision : on **clampe l'affichage** à `min(points_in_level, points_to_next_level)` avant tout calcul de seuil/progression pour ce niveau. Résultat : tous les N éléments apparaissent acquis, barre à 100%, pas de bloc "prochain élément" ni "points manquants" affiché.
- **0 point** : aucun élément acquis, premier élément = seuil[0].
- **Catégorie/niveau absent de la config** : la fonction retourne une liste vide et logge un avertissement dev — le niveau et la barre de progression restent corrects car ils ne dépendent que de `category_progress`, jamais de la config d'éléments.
- **Utilisateur existant** : aucune migration nécessaire. Tout étant dérivé de données déjà en base (`current_level`, `points_in_level`), le premier chargement post-déploiement affiche automatiquement tous les éléments correspondant à la progression déjà acquise. Aucune régression visuelle possible par construction (confirmé avec l'utilisateur — pas de fonction de "migration" à écrire, le calcul est fait en live à chaque rendu, comme l'est déjà le pourcentage de progression actuel).

### Fichiers nouveaux

- `lib/category-elements-config.ts` — configuration statique par `CategoryType` × niveau (1-5), liste ordonnée de `ProgressionElement`. Contenu initial = les libellés fournis (Antre/Cri/Meute/Totem), marqués comme provisoires en commentaire (le libellé métier n'est pas figé, les assets ne sont pas encore générés).
- `lib/category-elements.ts` — fonctions pures :
  - `getElementThresholds(costToNextLevel, elementCount)`
  - `getUnlockedElements(category, level, pointsInLevel)`
  - `getNextElement(category, level, pointsInLevel)`
  - `getPointsRemainingToElement(category, level, pointsInLevel)`
  - `getPointsWithinCurrentLevel(pointsInLevel, pointsToNextLevel)` (applique le clamp niveau max)
- `lib/category-elements.test.ts` — tests unitaires (voir section Tests).

### Type ajouté (`lib/types.ts`)

```ts
export interface ProgressionElement {
  id: string;
  label: string;
  alt: string;
  description?: string;
  assetPath?: string;
  order: number;
  family?: string;
}
```

`id` stable et indépendant du `label` affiché (permet de renommer un libellé sans casser une référence future).

## Composants UI

### `SanctuaryCategoryCard` (remplace `HabitCard` sur cette page)

Affiche par catégorie : nom (Antre/Cri/Meute/Totem) + couleur (`CATEGORY_COLORS`), nom narratif du niveau courant (`getAccessoryName`, existant), badge "Niveau N/5", barre de progression `points_in_level / points_to_next_level` (clampée à 100% au niveau max), rangée d'éléments du niveau courant dans l'ordre `order` (pleins si acquis, estompés si verrouillés), bloc "Prochain élément : *label* dans *N* points" (masqué au niveau max), bloc "Niveau suivant dans *N* points" (masqué au niveau max), aperçu compact du niveau suivant si niveau < 5.

### `ProgressionElementIcon` (nouveau)

```ts
type ProgressionElementIconProps = {
  element: ProgressionElement;
  state: 'unlocked' | 'locked';
};
```

- `assetPath` défini → `<Image source={...} accessibilityLabel={element.alt} />`.
- `assetPath` absent → placeholder : chip coloré (teinte catégorie, `mid`/`light` selon état) avec 1-2 lettres du `label`, taille alignée sur la future icône, `accessibilityLabel={element.alt}` (projet Expo/React Native : pas d'attribut HTML `alt`, on utilise l'API d'accessibilité RN).
- Le remplacement futur du placeholder par une image réelle ne change que la branche interne du composant, jamais l'appelant.

## Notifications de déblocage

Aucun mécanisme de toast/snackbar générique n'existe dans le projet (seul `CelebrationModal`, dédié au changement de tier du loup via `user_palette_progression`, existe). Décision : **pas de notification en v1**. La mise à jour visuelle de la carte à l'ouverture de la page fait office de feedback. `CelebrationModal` et son déclenchement restent inchangés et prioritaires.

## Tests

**Unitaires** (`lib/category-elements.test.ts`) : seuils pour 1 à 5 éléments, coûts divisibles/non divisibles, exemples de référence (`[25,50]`, `[20,40,60,80]`, `[13,25,38]`), ordre strictement croissant, dernier seuil `< C`. États de progression : 0 point, juste avant/à/après un seuil, dernier élément obtenu, niveau atteint, niveau max, config incomplète, utilisateur existant avec plusieurs niveaux déjà terminés.

**Composants** (`components/profile-redesign/SanctuaryCategoryCard.test.tsx`) : affichage niveau/points, coût du niveau suivant, éléments acquis/verrouillés, prochain élément, points manquants, placeholder vs image réelle, absence de bloc "prochain élément"/"niveau suivant" au niveau max, cohérence niveau/éléments affichés.

**Divergence signalée** : la demande initiale prévoyait des tests Playwright. LifeXP est une app **Expo Router / React Native**, sans surface web — Playwright ne s'y applique pas. Cette partie de la demande est donc non applicable telle quelle ; si un besoin e2e mobile existe, il faudrait passer par Detox ou Maestro (hors périmètre de ce document, à cadrer séparément si souhaité).

## Ce qui n'est pas touché

`lib/avatar-level.ts`, `lib/wolf-data.ts`, `lib/scoring-config.ts`, `lib/accessoires.ts` (fonctions existantes), `CelebrationModal`, migrations SQL existantes, edge function `apply-daily-scoring`, route/fichier `profile.tsx`, clés `CategoryType`.

## Points restant provisoires

- Les libellés d'éléments (section "Configuration initiale") sont explicitement provisoires (validés par l'utilisateur comme point de départ, modifiables sans toucher au calcul).
- Les assets d'icônes réels ne sont pas encore générés — le dossier `assets/icones_accessoires/` contient des planches SVG brutes non découpées/non câblées, non utilisées par cette implémentation (placeholder textuel utilisé à la place).
