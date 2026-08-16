# Graph Report - LifeXP  (2026-08-04)

## Corpus Check
- 146 files · ~1,482,509 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 908 nodes · 1678 edges · 52 communities (51 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63ba443a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `useWolfLevelTheme()` - 40 edges
2. `CategoryType` - 37 edges
3. `useAppTheme()` - 34 edges
4. `Habit` - 28 edges
5. `ThemedText()` - 25 edges
6. `ensureContrast()` - 22 edges
7. `requireUserId()` - 21 edges
8. `getReadableTextColor()` - 20 edges
9. `expo` - 16 edges
10. `Point System Redesign Implementation Plan` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CategoryHeaderProps` --references--> `CategoryType`  [EXTRACTED]
  components/category-header.tsx → lib/types.ts
- `PerformanceChartsProps` --references--> `Habit`  [EXTRACTED]
  components/performance-charts.tsx → lib/types.ts
- `TabLayout()` --calls--> `useAppTheme()`  [EXTRACTED]
  app/(tabs)/_layout.tsx → hooks/use-app-theme.ts
- `DashboardScreen()` --calls--> `useWolfLevelTheme()`  [EXTRACTED]
  app/(tabs)/dashboard.tsx → lib/hooks/use-wolf-level-theme.ts
- `HomeScreen()` --calls--> `useAppTheme()`  [EXTRACTED]
  app/(tabs)/index.tsx → hooks/use-app-theme.ts

## Import Cycles
- None detected.

## Communities (52 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (26): HabitCard(), WolfTheme, ensureContrast(), getContrastRatio(), getPaletteForLevel(), hexToRgb(), LEVEL_10_MYSTIQUE_DIVIN, LEVEL_1_OMBRE_FERMEE (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (31): AccessoryIconProps, AddHabitModal(), EXPERTISE_LABELS, FREQ_LABELS, INITIAL_FORM, Props, Step, styles (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (48): Avatar, CategorySectionProps, CelebrationModalProps, styles, CheckinItemSimplified(), CheckinItemSimplifiedProps, styles, CheckinItemWithPerformance() (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (24): AuthCallback(), styles, RootNavigator(), LoginScreen(), styles, CelebrationModal(), AuthContext, AuthContextValue (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (39): styles, getCategories(), HomeScreen(), styles, requireUserId(), addDays(), formatDayOfMonth(), formatLongDate() (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (34): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (34): dependencies, expo, expo-auth-session, expo-constants, expo-font, expo-haptics, expo-image, expo-linking (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (41): ProfileScreen(), styles, ProfileHeader(), ProfileHeaderProps, SanctuaryCategoryCardProps, renderedAvatarLevels, CategoryLevels, countAtLeast() (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (23): AvatarComponent(), AvatarProps, sizeConfig, styles, GOT_AVATAR_ASSETS, styles, SVGAvatarLoader, SVGAvatarLoaderProps (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (18): DashboardScreen(), LineChart(), LineChartProps, styles, getCategoryLabels(), PerformanceCharts(), PerformanceChartsProps, styles (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (19): TabLayout(), CategoryModal(), CategoryModalProps, COLORS, styles, DayButton(), DayButtonProps, styles (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (12): CategoryHeader(), CategoryHeaderProps, styles, CategorySection(), styles, CATEGORY_PROJECTION_COPY, formatPoints(), formatProjectionLine() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (34): AccessoryIcon, AccessoryIconComponent(), styles, CategoryEvolutionModal(), styles, ProgressionElementIcon(), ProgressionElementIconProps, styles (+26 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (11): backfillHabitLogs(), fetchAllHabits(), fetchAllPresets(), findPresetMatch(), HabitToMigrate, linkHabitToPreset(), main(), MigrationReport (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-expo, jest, jest-expo, react-test-renderer, @types/jest, @types/react (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (8): scripts, android, ios, lint, reset-project, start, test, web

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (5): CATEGORY_EMOJIS, COMPLETION_EMOJIS, EMOTIONAL_EMOJIS, FREQUENCY_EMOJIS, STATUS_EMOJIS

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, @/*

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (4): avatarDir, files, fs, path

### Community 20 - "Community 20"
Cohesion: 0.47
Nodes (5): ensureEnfantsPreset(), fetchPresetMap(), main(), PRESET_MAPPING, supabase

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (3): CATEGORIES, PtsScaleEntry, ScoringConfig

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (4): main, name, private, version

### Community 24 - "Community 24"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (33): 1. Theme Context & Hook, 1. Theming Engine, 2. Data Model, 2. Database Layer, 3. Hook/Context for Active Palette, 3. UI Components, 4. Celebration Screen, 5. App Layout (+25 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (28): File Structure, Google OAuth + RLS + Migration + Audit sécurité — Implementation Plan, Self-Review (rempli à l'écriture du plan), Task 0: Installer les dépendances et l'infra de test, Task 10: Rapport d'audit de sécurité, Task 11: Vérification finale, Task 1: Adaptateur de stockage chiffré chunké, Task 2: Reconfigurer le client Supabase (+20 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (27): 1.1 Table supprimée, 1.2 Nouvelle table : `scoring_config`, 1.3 Nouvelle table : `category_progress`, 1. Schéma DB, 2.1 Algorithme par user × catégorie, 2.2 Invariants, 2. Logique de scoring (edge function — minuit UTC), 3. Noms de devise par catégorie (+19 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (27): 1.1 Table supprimée, 1.2 Nouvelle table : `scoring_config`, 1.3 Nouvelle table : `category_progress`, 1. Schéma DB, 2.1 Algorithme par user × catégorie, 2.2 Invariants, 2. Logique de scoring (edge function — minuit UTC), 3. Noms de devise par catégorie (+19 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (26): Evolutionary Theming System Implementation Plan, File Structure, Modified Files, New Files, Phase 1: Foundation (DB + Palette Definitions), Phase 2: Theming Engine (Context + Hook), Phase 3: Animation & UI (CelebrationModal), Phase 4: Integration (Root Layout) (+18 more)

### Community 36 - "Community 36"
Cohesion: 0.09
Nodes (21): Backend, Calcul de l'expérience totale, Classes (10 tiers), Contenu de chaque cellule, Données wolf — `lib/wolf-data.ts`, Fichiers modifiés / créés, `getNextLevelText(levels: CategoryLevels): string`, Goal (+13 more)

### Community 37 - "Community 37"
Cohesion: 0.10
Nodes (19): 1. Résumé, 2. Philosophie de l'application, 3. Expérience utilisateur, 4. Système de progression, 5. Identité visuelle évolutive, 6. Architecture fonctionnelle, 7. Sécurité et fiabilité, 8. Ce que LifeXP cherche à faire ressentir (+11 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): Cas limites, Ce qui n'est pas touché, Composants UI, Contexte, Fichiers nouveaux, Formule des seuils, Notifications de déblocage, Nouveau sous-système : éléments visuels de progression (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (16): File Map, Point System Redesign Implementation Plan, Task 10: HeroBanner — supprimer weeklyScore, Task 11: app/(tabs)/index.tsx — câbler les nouvelles données, Task 12: app/(tabs)/profile.tsx — nouveau UI, Task 13: Nettoyage — supprimer les fichiers momentum, Task 1: Migration SQL, Task 2: Types TypeScript (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (13): File map, Momentum System Implementation Plan, Part A: Add momentum state + fetch to `index.tsx`, Part B: Update `category-section.tsx`, Spec clarifications (answered before implementation), Spec coverage self-check, Task 1: SQL Migration — `category_momentum` table, Task 2: Pure calculations — `lib/momentum.ts` (TDD) (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (11): Constats détaillés, Faible / Info — Code mort, Faible — Vulnérabilités de dépendances (chaîne de build), Info — Allowlist des redirect URLs (à configurer côté Supabase), Moyen — RLS (Row Level Security), Moyen — Stockage des tokens de session, Rapport d'audit de sécurité — LifeXP, Recommandations de suivi (par priorité) (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (9): Add Habit — Preset Modal Implementation Plan, Fichiers touchés, Task 1 : Composant `AddHabitModal` — squelette 3 étapes, Task 2 : Étape 1 — Picker de presets, Task 3 : Étape 2 — Sélection du niveau, Task 4 : Étape 3 — Formulaire pré-rempli, Task 5 : Bouton en bas + branchement dans `index.tsx`, Task 6 : Styles et polish (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (9): Fichiers touchés, Presets V2 — Restructuration & Nouveaux Items, Tableau des changements de presets, Task 1 : Migration SQL — libération du champ expertise + restructuration, Task 2 : Mise à jour de seed.sql, Task 3 : UI — formateur d'unités + badge catégorie dans le picker, Vérification manuelle, Étape A — Formateur d'unités (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): Sanctuaire Page + Progression Elements Implementation Plan, Task 1: Add `ProgressionElement` type, Task 2: Threshold formula and level-max clamp (pure math, no config yet), Task 3: Per-category / per-level element configuration, Task 4: Derived element functions, Task 5: `ProgressionElementIcon` component, Task 6: `SanctuaryCategoryCard` component (replaces `HabitCard` on this page), Task 7: Wire into the page, rename tab, remove the old card (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.42
Nodes (6): CATEGORY_COLORS, Fonts, getGradientColor(), interpolateColor(), ThemeColors, WEEK_SUMMARY_SCORE_STOPS

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): Dark Mode Toggle Implementation Plan, File Map, Task 1: Create ThemeContext, Task 2: Wire ThemeContextProvider into _layout.tsx, Task 3: Update useColorScheme (both native and web) to read from ThemeContext, Task 4: Add toggle button to AppHeader, Task 5: Manual smoke test

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (7): Checklist post-implémentation, Fichiers, Notes pour l'exécution, Profile Redesign Implementation Plan, Task 1 : `lib/wolf-data.ts` — données et fonctions pures, Task 2 : Migration Supabase + `lib/profiles.ts`, Task 3 : Réécriture de `app/(tabs)/profile.tsx`

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (6): Avatar Assets - Game of Thrones Avatars, Current Structure, Integration, Naming Convention, Score Mapping, SVG Requirements

### Community 49 - "Community 49"
Cohesion: 0.38
Nodes (6): computeStreak(), HeroBanner(), HeroBannerProps, styles, WeekDay, getWolfQuote()

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): Get a fresh project, Get started, Join the community, Learn more, Welcome to your Expo app 👋

## Knowledge Gaps
- **445 isolated node(s):** `appVersionSource`, `name`, `slug`, `version`, `orientation` (+440 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useWolfLevelTheme()` connect `Community 2` to `Community 1`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 12`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `CategoryType` connect `Community 1` to `Community 2`, `Community 4`, `Community 7`, `Community 9`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useAppTheme()` connect `Community 10` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 9`, `Community 11`, `Community 49`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `appVersionSource`, `name`, `slug` to the rest of the system?**
  _445 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08902439024390243 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.061057692307692306 - nodes in this community are weakly interconnected._