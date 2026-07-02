# Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte de `app/(tabs)/profile.tsx` — section hero avatar/loup + grille accessoires nommés par niveau, avec nom du loup éditable via modal et stocké dans Supabase.

**Architecture:** Option 2 — modification de `profile.tsx` + extraction dans `lib/wolf-data.ts` et `lib/profiles.ts`. Pas de nouveaux composants extraits ; `AccessoryCell` reste une fonction locale dans `profile.tsx`. Migration SQL pour table `profiles`.

**Tech Stack:** React Native / Expo, TypeScript, Supabase, Jest (jest-expo)

---

## Fichiers

| Fichier | Action |
|---|---|
| `lib/wolf-data.ts` | Créer — classes, mantras, noms accessoires par niveau, calcul XP total, texte prochain niveau |
| `lib/wolf-data.test.ts` | Créer — tests unitaires pour toutes les fonctions pure |
| `lib/profiles.ts` | Créer — fetch/save du wolf_name dans Supabase |
| `supabase/migrations/20260625000000_create_profiles.sql` | Créer — table profiles + RLS |
| `app/(tabs)/profile.tsx` | Réécriture complète du JSX et des styles |

---

## Task 1 : `lib/wolf-data.ts` — données et fonctions pures

**Fichiers :**
- Créer : `lib/wolf-data.ts`
- Créer : `lib/wolf-data.test.ts`

- [ ] **Étape 1.1 : Écrire les tests qui échouent**

Créer `lib/wolf-data.test.ts` :

```ts
import {
  getWolfTierIndex,
  getWolfClass,
  getNextClass,
  getStarString,
  getAccessoryName,
  computeTotalXP,
  getNextLevelText,
} from './wolf-data';
import type { CategoryType, CategoryProgress } from './types';
import { SCORING_CONFIG_FALLBACK } from './scoring-config';

function lvl(sc: number, dp: number, vf: number, vp: number): Record<CategoryType, number> {
  return { self_care: sc, dev_perso: dp, vie_familiale: vf, vie_pro: vp };
}

function prog(sc: number, dp: number, vf: number, vp: number, pts = 0): Record<CategoryType, CategoryProgress> {
  const make = (category: CategoryType, level: number): CategoryProgress => ({
    user_id: '', category, current_level: level, points_in_level: pts,
    last_maintenance_date: null, updated_at: '',
  });
  return {
    self_care:     make('self_care', sc),
    dev_perso:     make('dev_perso', dp),
    vie_familiale: make('vie_familiale', vf),
    vie_pro:       make('vie_pro', vp),
  };
}

describe('getWolfTierIndex', () => {
  it('score 5 → tier 0', () => expect(getWolfTierIndex(5)).toBe(0));
  it('score 15 → tier 1', () => expect(getWolfTierIndex(15)).toBe(1));
  it('score 35 → tier 3', () => expect(getWolfTierIndex(35)).toBe(3));
  it('score 95 → tier 9', () => expect(getWolfTierIndex(95)).toBe(9));
});

describe('getWolfClass', () => {
  it('score 5 → Louveteau des Cendres', () =>
    expect(getWolfClass(5)).toBe('Louveteau des Cendres'));
  it('score 15 → Éveil des Frimas', () =>
    expect(getWolfClass(15)).toBe('Éveil des Frimas'));
  it('score 95 → Loup Dieu des Origines', () =>
    expect(getWolfClass(95)).toBe('Loup Dieu des Origines'));
});

describe('getNextClass', () => {
  it('score 5 → Éveil des Frimas', () =>
    expect(getNextClass(5)).toBe('Éveil des Frimas'));
  it('score 85 → Loup Dieu des Origines', () =>
    expect(getNextClass(85)).toBe('Loup Dieu des Origines'));
  it('score 95 → null', () => expect(getNextClass(95)).toBeNull());
});

describe('getStarString', () => {
  it('tier 0 (score 5) → 1 étoile remplie', () =>
    expect(getStarString(5)).toBe('★☆☆☆☆☆☆☆☆☆'));
  it('tier 4 (score 45) → 5 étoiles remplies', () =>
    expect(getStarString(45)).toBe('★★★★★☆☆☆☆☆'));
  it('tier 9 (score 95) → 10 étoiles remplies', () =>
    expect(getStarString(95)).toBe('★★★★★★★★★★'));
});

describe('getAccessoryName', () => {
  it('Antre niv1 → Tanière des Cendres', () =>
    expect(getAccessoryName('self_care', 1)).toBe('Tanière des Cendres'));
  it('Antre niv3 → Refuge des Forêts', () =>
    expect(getAccessoryName('self_care', 3)).toBe('Refuge des Forêts'));
  it('Antre niv5 → Caverne des Cristaux', () =>
    expect(getAccessoryName('self_care', 5)).toBe('Caverne des Cristaux'));
  it('Cri niv2 → Grondement des Plaines', () =>
    expect(getAccessoryName('dev_perso', 2)).toBe('Grondement des Plaines'));
  it('Cri niv5 → Chant des Origines', () =>
    expect(getAccessoryName('dev_perso', 5)).toBe('Chant des Origines'));
  it('Meute niv2 → Duo des Lisières', () =>
    expect(getAccessoryName('vie_familiale', 2)).toBe('Duo des Lisières'));
  it('Totem niv4 → Totem Ardent', () =>
    expect(getAccessoryName('vie_pro', 4)).toBe('Totem Ardent'));
  it('Totem niv5 → Totem Divin', () =>
    expect(getAccessoryName('vie_pro', 5)).toBe('Totem Divin'));
});

describe('computeTotalXP', () => {
  it('tous N1, 0 pts → 0 XP', () =>
    expect(computeTotalXP(prog(1, 1, 1, 1, 0), SCORING_CONFIG_FALLBACK)).toBe(0));
  it('tous N1, 10 pts chacun → 40 XP', () =>
    expect(computeTotalXP(prog(1, 1, 1, 1, 10), SCORING_CONFIG_FALLBACK)).toBe(40));
  it('tous N2, 0 pts → 200 XP (4×50)', () =>
    expect(computeTotalXP(prog(2, 2, 2, 2, 0), SCORING_CONFIG_FALLBACK)).toBe(200));
  it('Antre N3 reste N1, 0 pts → 115 XP (50+65 pour Antre)', () =>
    expect(computeTotalXP(prog(3, 1, 1, 1, 0), SCORING_CONFIG_FALLBACK)).toBe(115));
  it('tous N2, 5 pts chacun → 220 XP', () =>
    expect(computeTotalXP(prog(2, 2, 2, 2, 5), SCORING_CONFIG_FALLBACK)).toBe(220));
});

describe('getNextLevelText', () => {
  it('tous N1 (score 5) → Antre niv2', () =>
    expect(getNextLevelText(lvl(1, 1, 1, 1))).toBe('Antre niv2'));
  it('Antre N2, reste N1 (score 15) → Cri niv2', () =>
    expect(getNextLevelText(lvl(2, 1, 1, 1))).toBe('Cri niv2'));
  it('Antre+Cri N2, reste N1 (score 25) → Meute niv2, Totem niv2', () =>
    expect(getNextLevelText(lvl(2, 2, 1, 1))).toBe('Meute niv2, Totem niv2'));
  it('tous N2 (score 35) → Antre niv3, Cri niv3', () =>
    expect(getNextLevelText(lvl(2, 2, 2, 2))).toBe('Antre niv3, Cri niv3'));
  it('Antre+Cri N3, reste N2 (score 45) → Meute niv3, Totem niv3', () =>
    expect(getNextLevelText(lvl(3, 3, 2, 2))).toBe('Meute niv3, Totem niv3'));
  it('tous N3 (score 55) → Antre niv4, Cri niv4', () =>
    expect(getNextLevelText(lvl(3, 3, 3, 3))).toBe('Antre niv4, Cri niv4'));
  it('tous N5 (score 95) → —', () =>
    expect(getNextLevelText(lvl(5, 5, 5, 5))).toBe('—'));
});
```

- [ ] **Étape 1.2 : Vérifier que les tests échouent**

```bash
npx jest lib/wolf-data.test.ts --no-coverage
```

Attendu : FAIL avec "Cannot find module './wolf-data'"

- [ ] **Étape 1.3 : Créer `lib/wolf-data.ts`**

```ts
import { getAvatarScoreFromLevels, type CategoryLevels } from './avatar-level';
import { SCORING_CONFIG_FALLBACK } from './scoring-config';
import type { CategoryProgress, CategoryType, ScoringConfig } from './types';
import { CATEGORY_KEYS } from './types';

const SCORE_THRESHOLDS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95] as const;

const WOLF_CLASSES = [
  'Louveteau des Cendres',
  'Éveil des Frimas',
  'Rôdeur des Lisières',
  'Traqueur des Herbes',
  'Chasseur des Brumes',
  'Gardien des Clairières',
  'Seigneur des Territoires',
  'Loup-Totem',
  'Esprit de la Meute',
  'Loup Dieu des Origines',
] as const;

const WOLF_MANTRAS: readonly string[][] = [
  ['Chaque jour est un premier pas.', 'Le feu commence par une étincelle.', "Dormir, c'est déjà survivre."],
  ["J'ouvre les yeux sur ce que je peux devenir.", 'Le froid réveille.', 'Je sens le monde pour la première fois.'],
  ["Je n'appartiens pas encore à la forêt, mais je l'approche.", 'Chaque lisière franchie est une victoire.', 'Je rôde, donc j\'existe.'],
  ["Je suis patient. La proie vient à qui sait attendre.", 'Mes pattes connaissent le chemin.', 'Je trace ma route dans l\'herbe haute.'],
  ["La brume ne me cache plus, elle me protège.", 'Je chasse ce qui me rend plus fort.', "L'effort d'aujourd'hui nourrit demain."],
  ['Je protège ce qui compte.', "La clairière est à moi parce que je l'ai méritée.", "Garder, c'est aussi grandir."],
  ['Mon territoire est le reflet de ma discipline.', "Je n'occupe pas l'espace, je le mérite.", "Chaque habitude est une frontière que j'étends."],
  ['Je suis devenu ce que je pratique.', 'Ma légende s\'écrit chaque matin.', 'Les autres voient le résultat. Je connais le chemin.'],
  ['Je ne cours plus pour moi seul.', "Mon énergie rayonne sur ceux qui m'entourent.", "L'esprit ne vieillit pas. Il s'affine."],
  ["Je suis l'origine et l'aboutissement.", 'Rien ne commence sans effort. Rien ne s\'arrête sans raison.', 'Je suis la preuve que c\'est possible.'],
];

const ACCESSORY_NAMES: Record<CategoryType, readonly string[]> = {
  self_care:     ['Tanière des Cendres', 'Antre des Racines', 'Refuge des Forêts', 'Sanctuaire des Profondeurs', 'Caverne des Cristaux'],
  dev_perso:     ['Souffle Muet', 'Grondement des Plaines', 'Rugissement Doré', 'Hurlement des Vagues', 'Chant des Origines'],
  vie_familiale: ['Loup Solitaire', 'Duo des Lisières', 'Meute des Clairières', 'Meute des Territoires', 'Légion des Ombres'],
  vie_pro:       ['Pierre Brute', 'Stèle Gravée', 'Totem Éveillé', 'Totem Ardent', 'Totem Divin'],
};

const NEXT_LEVEL_CATS: Array<{ key: CategoryType; label: string }> = [
  { key: 'self_care',     label: 'Antre' },
  { key: 'dev_perso',     label: 'Cri' },
  { key: 'vie_familiale', label: 'Meute' },
  { key: 'vie_pro',       label: 'Totem' },
];

export function getWolfTierIndex(score: number): number {
  const idx = SCORE_THRESHOLDS.findIndex(t => score <= t);
  return idx >= 0 ? idx : SCORE_THRESHOLDS.length - 1;
}

export function getWolfClass(score: number): string {
  return WOLF_CLASSES[getWolfTierIndex(score)];
}

export function getNextClass(score: number): string | null {
  const idx = getWolfTierIndex(score);
  return idx < WOLF_CLASSES.length - 1 ? WOLF_CLASSES[idx + 1] : null;
}

export function getStarString(score: number): string {
  const filled = getWolfTierIndex(score) + 1;
  return '★'.repeat(filled) + '☆'.repeat(10 - filled);
}

export function getRandomMantra(tierIndex: number): string {
  const quotes = WOLF_MANTRAS[Math.min(tierIndex, WOLF_MANTRAS.length - 1)];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getAccessoryName(category: CategoryType, level: number): string {
  const names = ACCESSORY_NAMES[category];
  return names[Math.min(Math.max(level - 1, 0), names.length - 1)];
}

export function computeTotalXP(
  progress: Record<CategoryType, CategoryProgress>,
  scoringConfigs: ScoringConfig[]
): number {
  return CATEGORY_KEYS.reduce((total, cat) => {
    const { current_level, points_in_level } = progress[cat];
    let past = 0;
    for (let l = 1; l < current_level; l++) {
      const cfg = scoringConfigs.find(c => c.level === l) ?? SCORING_CONFIG_FALLBACK[0];
      past += cfg.points_to_next_level;
    }
    return total + past + points_in_level;
  }, 0);
}

export function getNextLevelText(levels: CategoryLevels): string {
  const score = getAvatarScoreFromLevels(levels);
  if (score >= 95) return '—';

  const below = (minLevel: number) => NEXT_LEVEL_CATS.filter(c => levels[c.key] < minLevel);
  const fmt = (cats: typeof NEXT_LEVEL_CATS, niv: number) =>
    cats.map(c => `${c.label} niv${niv}`).join(', ');

  if (score <= 5)  return fmt(below(2).slice(0, 1), 2);
  if (score <= 15) return fmt(below(2).slice(0, 1), 2);
  if (score <= 25) return fmt(below(2), 2);
  if (score <= 35) return fmt(below(3).slice(0, 2), 3);
  if (score <= 45) return fmt(below(3), 3);
  if (score <= 55) return fmt(below(4).slice(0, 2), 4);
  if (score <= 65) return fmt(below(4), 4);
  if (score <= 75) return fmt(below(5).slice(0, 2), 5);
  return fmt(below(5), 5);
}
```

- [ ] **Étape 1.4 : Vérifier que les tests passent**

```bash
npx jest lib/wolf-data.test.ts --no-coverage
```

Attendu : PASS, toutes les suites vertes

- [ ] **Étape 1.5 : Commit**

```bash
git add lib/wolf-data.ts lib/wolf-data.test.ts
git commit -m "feat(lib): wolf-data — classes, mantras, accessoires, XP total, prochain niveau"
```

---

## Task 2 : Migration Supabase + `lib/profiles.ts`

**Fichiers :**
- Créer : `supabase/migrations/20260625000000_create_profiles.sql`
- Créer : `lib/profiles.ts`

- [ ] **Étape 2.1 : Créer la migration SQL**

Créer `supabase/migrations/20260625000000_create_profiles.sql` :

```sql
create table if not exists profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  wolf_name  text not null default 'Loup Sans Nom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);
```

- [ ] **Étape 2.2 : Créer `lib/profiles.ts`**

```ts
import { requireUserId } from './auth';
import { supabase } from './supabase';

export async function fetchWolfName(): Promise<string> {
  if (!supabase) return 'Loup Sans Nom';
  const userId = await requireUserId();
  const { data } = await supabase
    .from('profiles')
    .select('wolf_name')
    .eq('user_id', userId)
    .single();
  return data?.wolf_name ?? 'Loup Sans Nom';
}

export async function saveWolfName(name: string): Promise<void> {
  if (!supabase) return;
  const userId = await requireUserId();
  await supabase
    .from('profiles')
    .upsert({ user_id: userId, wolf_name: name.trim(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}
```

- [ ] **Étape 2.3 : Commit**

```bash
git add supabase/migrations/20260625000000_create_profiles.sql lib/profiles.ts
git commit -m "feat: table profiles + lib/profiles (wolf_name persistant)"
```

---

## Task 3 : Réécriture de `app/(tabs)/profile.tsx`

**Fichiers :**
- Modifier : `app/(tabs)/profile.tsx`

- [ ] **Étape 3.1 : Remplacer entièrement `profile.tsx`**

```tsx
import { AccessoryIcon } from '@/components/accessory-icon';
import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import { defaultAllCategoryProgress, fetchCategoryProgress } from '@/lib/category-progress';
import { fetchWolfName, saveWolfName } from '@/lib/profiles';
import { fetchScoringConfig, getScoringConfigForLevel, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { useThemeContext } from '@/lib/theme-context';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { CATEGORY_KEYS } from '@/lib/types';
import {
  computeTotalXP,
  getAccessoryName,
  getNextClass,
  getNextLevelText,
  getRandomMantra,
  getStarString,
  getWolfClass,
  getWolfTierIndex,
} from '@/lib/wolf-data';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORY_ACCENT: Record<CategoryType, string> = {
  self_care:     '#4caf50',
  dev_perso:     '#ba68c8',
  vie_familiale: '#ef5350',
  vie_pro:       '#42a5f5',
};

function AccessoryCell({
  category,
  catProgress,
  scoringConfigs,
}: {
  category: CategoryType;
  catProgress: CategoryProgress;
  scoringConfigs: ScoringConfig[];
}) {
  const { colors } = useAppTheme();
  const accent = CATEGORY_ACCENT[category];
  const config = getScoringConfigForLevel(scoringConfigs, catProgress.current_level);
  const isMaxLevel = catProgress.current_level >= 5;
  const progressRatio = isMaxLevel
    ? 1
    : Math.min(1, catProgress.points_in_level / config.points_to_next_level);

  return (
    <View style={styles.accessoryCell}>
      <AccessoryIcon category={category} level={catProgress.current_level} size={64} />
      <ThemedText style={[styles.accessoryName, { color: accent }]}>
        {getAccessoryName(category, catProgress.current_level)}
      </ThemedText>
      <View style={styles.progressRow}>
        <ThemedText style={[styles.progressNum, { color: colors.textSubtle }]}>0</ThemedText>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accent },
            ]}
          />
        </View>
        <ThemedText style={[styles.progressNum, { color: colors.textSubtle }]}>
          {isMaxLevel ? '—' : String(config.points_to_next_level)}
        </ThemedText>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, styles: themeStyles } = useAppTheme();
  const { toggleTheme, mode } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);
  const [wolfName, setWolfName] = useState('Loup Sans Nom');
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [progress, configs, name] = await Promise.all([
          fetchCategoryProgress().catch(() => null),
          fetchScoringConfig().catch(() => SCORING_CONFIG_FALLBACK),
          fetchWolfName().catch(() => 'Loup Sans Nom'),
        ]);
        if (progress) setCategoryProgress(progress);
        if (configs.length) setScoringConfigs(configs);
        setWolfName(name);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const progress = categoryProgress ?? defaultAllCategoryProgress('');

  const levels = useMemo(
    () => Object.fromEntries(CATEGORY_KEYS.map(cat => [cat, progress[cat].current_level])) as Record<CategoryType, number>,
    [progress]
  );

  const avatarScore = useMemo(() => getAvatarScoreFromLevels(levels), [levels]);
  const tierIndex   = getWolfTierIndex(avatarScore);
  const wolfClass   = getWolfClass(avatarScore);
  const starString  = getStarString(avatarScore);
  const totalXP     = useMemo(() => computeTotalXP(progress, scoringConfigs), [progress, scoringConfigs]);
  const mantra      = useMemo(() => getRandomMantra(tierIndex), [tierIndex]);
  const nextClass   = getNextClass(avatarScore);
  const nextLvlTxt  = useMemo(() => getNextLevelText(levels), [levels]);

  function openNameModal() {
    setNameInput(wolfName);
    setModalVisible(true);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await saveWolfName(trimmed);
    setWolfName(trimmed);
    setModalVisible(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, themeStyles.screen]}>
        <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, themeStyles.screen]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ThemedText style={[styles.headerTitle, { color: colors.tint }]}>Life XP</ThemedText>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
            <ThemedText style={[styles.themeBtnText, { color: colors.textMuted }]}>
              {mode === 'dark' ? '☀' : '🌙'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={[styles.hero, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.heroAvatar}>
            <Avatar score={avatarScore} size="medium" />
          </View>
          <View style={styles.heroInfo}>
            <TouchableOpacity onPress={openNameModal}>
              <ThemedText style={[styles.wolfName, { color: colors.text }]}>{wolfName}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.wolfClass, { color: colors.tint }]}>{wolfClass}</ThemedText>
            <ThemedText style={[styles.wolfStars, { color: colors.tint }]}>{starString}</ThemedText>
            <ThemedText style={[styles.wolfXP, { color: colors.textSubtle }]}>
              Expérience : {totalXP} XP
            </ThemedText>
            <ThemedText style={[styles.wolfMantra, { color: colors.textMuted }]} numberOfLines={3}>
              "{mantra}"
            </ThemedText>
            {nextClass && (
              <ThemedText style={[styles.nextInfo, { color: colors.textSubtle }]}>
                Prochain classe : {nextClass}
              </ThemedText>
            )}
            <ThemedText style={[styles.nextInfo, { color: colors.textSubtle }]}>
              Pour prochain niveau : {nextLvlTxt}
            </ThemedText>
          </View>
        </View>

        {/* Accessoires ligne 1 */}
        <View style={[styles.accessoryRow, { borderBottomColor: colors.border }]}>
          <AccessoryCell category="self_care"     catProgress={progress.self_care}     scoringConfigs={scoringConfigs} />
          <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
          <AccessoryCell category="dev_perso"     catProgress={progress.dev_perso}     scoringConfigs={scoringConfigs} />
        </View>

        {/* Accessoires ligne 2 */}
        <View style={styles.accessoryRow}>
          <AccessoryCell category="vie_familiale" catProgress={progress.vie_familiale} scoringConfigs={scoringConfigs} />
          <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
          <AccessoryCell category="vie_pro"       catProgress={progress.vie_pro}       scoringConfigs={scoringConfigs} />
        </View>

        {/* Modal édition nom */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
            <Pressable style={[styles.modalBox, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Nom du loup</ThemedText>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                maxLength={30}
                autoFocus
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalSave, { backgroundColor: colors.tint }]}
              >
                <ThemedText style={styles.modalSaveLabel}>Sauvegarder</ThemedText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  themeBtn: { padding: 4 },
  themeBtnText: { fontSize: 20 },

  hero: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  heroAvatar: { width: 180, alignItems: 'center', justifyContent: 'flex-start' },
  heroInfo: { flex: 1, gap: 4 },
  wolfName:  { fontSize: 18, fontWeight: '800' },
  wolfClass: { fontSize: 13, fontWeight: '600' },
  wolfStars: { fontSize: 16, letterSpacing: 2 },
  wolfXP:    { fontSize: 12 },
  wolfMantra: { fontSize: 11, fontStyle: 'italic', marginTop: 4, lineHeight: 16 },
  nextInfo:  { fontSize: 11, marginTop: 2 },

  accessoryRow: { flexDirection: 'row', borderBottomWidth: 1 },
  vDivider: { width: 1 },
  accessoryCell: { flex: 1, alignItems: 'center', padding: 16, gap: 8 },
  accessoryName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  progressRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%' },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressNum:   { fontSize: 8, minWidth: 20, textAlign: 'center' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: { width: 280, borderRadius: 12, padding: 24, gap: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  modalSave: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalSaveLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Étape 3.2 : Lancer les tests existants**

```bash
npx jest --no-coverage
```

Attendu : PASS. Si des imports cassés apparaissent, vérifier les chemins `@/lib/wolf-data` et `@/lib/profiles`.

- [ ] **Étape 3.3 : Test manuel dans le simulateur**

Checklist à vérifier :
- [ ] Chargement : spinner visible, puis profil affiché
- [ ] Avatar affiché en grand à gauche de la section hero
- [ ] Nom du loup affiché, tap ouvre le modal
- [ ] Saisie d'un nom → "Sauvegarder" → le nom se met à jour dans la vue
- [ ] Classe correcte affichée (ex. "Louveteau des Cendres" si niveaux tous = 1)
- [ ] 10 caractères ★/☆ corrects selon le tier
- [ ] Expérience en XP cohérente (0 XP si tout N1 et 0 pts)
- [ ] Mantra affiché entre guillemets
- [ ] "Prochain classe" correct, absent si tier 10
- [ ] "Pour prochain niveau" correct selon les niveaux
- [ ] Ligne Antre | Cri avec noms par niveau et barres de progression
- [ ] Ligne Meute | Totem idem
- [ ] Toggle ☀/🌙 dans le header bascule le thème
- [ ] Dark mode : pas de texte blanc sur fond blanc

- [ ] **Étape 3.4 : Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat(profile): refonte — hero loup, accessoires nommés, modal nom"
```

---

## Checklist post-implémentation

- [ ] Toutes les suites de tests passent : `npx jest --no-coverage`
- [ ] Migration SQL prête à être appliquée en prod via `supabase db push` ou la console Supabase
- [ ] `getAccessoryName` appelé avec un niveau hors-range (0 ou 6) ne plante pas (clamp intégré)
- [ ] `computeTotalXP` utilise `SCORING_CONFIG_FALLBACK` comme fallback si un niveau n'est pas dans les configs

---

## Notes pour l'exécution

**`lib/auth.ts`** : `requireUserId()` est importé de ce module (déjà utilisé dans `lib/category-progress.ts`). Si le module n'existe pas encore, vérifier l'emplacement exact avec `find . -name "auth.ts" -not -path "*/node_modules/*"`.

**Avatar size "medium"** : 180×200 px — `heroAvatar: { width: 180 }` correspond exactement. Sur écrans < 360 px de large, réduire à `size="small"` (120×130 px) et `heroAvatar.width: 120` si nécessaire.

**Supabase en dev local** : la migration doit être appliquée avant de tester `fetchWolfName`. En dev sans Supabase configuré, le fallback `'Loup Sans Nom'` s'applique silencieusement.
