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
  getNextLevelSummary,
  getRandomMantra,
  getWolfClass,
  getWolfTierIndex,
} from '@/lib/wolf-data';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

function WolfTierBar({ tierIndex, tint, muted }: { tierIndex: number; tint: string; muted: string }) {
  const filled = tierIndex + 1;
  return (
    <View style={styles.tierContainer}>
      <View style={[styles.tierTrack, { backgroundColor: muted + '40' }]}>
        <View style={[styles.tierFill, { width: `${filled * 10}%`, backgroundColor: tint }]} />
      </View>
      <View style={styles.tierLabels}>
        {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map(n => (
          <ThemedText
            key={n}
            style={[styles.tierLabelNum, { color: n <= filled ? tint : muted }]}
          >
            {n}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

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
    <View style={[
      styles.accessoryCard,
      {
        backgroundColor: accent + '18',
        borderColor: accent + '55',
      },
    ]}>
      <AccessoryIcon category={category} level={catProgress.current_level} size={56} />
      <ThemedText style={[styles.accessoryName, { color: accent }]}>
        {getAccessoryName(category, catProgress.current_level)}
      </ThemedText>
      <ThemedText style={[styles.accessoryLevel, { color: colors.textMuted }]}>
        Niv. {catProgress.current_level}/5
      </ThemedText>
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: accent },
            ]}
          />
        </View>
      </View>
      <ThemedText style={[styles.progressPts, { color: colors.textMuted }]}>
        {isMaxLevel ? 'MAX!' : `${catProgress.points_in_level}/${config.points_to_next_level} pts`}
      </ThemedText>
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

  const avatarScore    = getAvatarScoreFromLevels(levels);
  const tierIndex      = getWolfTierIndex(avatarScore);
  const wolfClass      = getWolfClass(avatarScore);
  const totalXP        = useMemo(() => computeTotalXP(progress, scoringConfigs), [progress, scoringConfigs]);
  const mantra         = useMemo(() => getRandomMantra(tierIndex), [tierIndex]);
  const nextClass      = getNextClass(avatarScore);
  const nextLvlSummary = useMemo(() => getNextLevelSummary(levels), [levels]);

  function openNameModal() {
    setNameInput(wolfName);
    setModalVisible(true);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      await saveWolfName(trimmed);
      setWolfName(trimmed);
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder le nom.');
    }
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
            <WolfTierBar tierIndex={tierIndex} tint={colors.tint} muted={colors.textMuted} />
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
              Requis : {nextLvlSummary}
            </ThemedText>
          </View>
        </View>

        {/* Accessoires grid */}
        <View style={[styles.accessoryGrid, { borderTopColor: colors.border }]}>
          <View style={styles.accessoryRowCards}>
            <AccessoryCell category="self_care"     catProgress={progress.self_care}     scoringConfigs={scoringConfigs} />
            <AccessoryCell category="dev_perso"     catProgress={progress.dev_perso}     scoringConfigs={scoringConfigs} />
          </View>
          <View style={styles.accessoryRowCards}>
            <AccessoryCell category="vie_familiale" catProgress={progress.vie_familiale} scoringConfigs={scoringConfigs} />
            <AccessoryCell category="vie_pro"       catProgress={progress.vie_pro}       scoringConfigs={scoringConfigs} />
          </View>
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
  wolfXP:    { fontSize: 12 },
  wolfMantra: { fontSize: 11, fontStyle: 'italic', marginTop: 4, lineHeight: 16 },
  nextInfo:  { fontSize: 11, marginTop: 2 },

  tierContainer: { gap: 3, marginVertical: 4 },
  tierTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  tierFill:  { height: '100%', borderRadius: 4 },
  tierLabels: { flexDirection: 'row' },
  tierLabelNum: { flex: 1, fontSize: 8, fontWeight: '600', textAlign: 'center' },

  accessoryGrid: { padding: 12, gap: 12, borderTopWidth: 1 },
  accessoryRowCards: { flexDirection: 'row', gap: 12 },
  accessoryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  accessoryName:  { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  accessoryLevel: { fontSize: 10, textAlign: 'center' },
  progressRow:    { width: '100%' },
  progressTrack:  { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  progressPts:    { fontSize: 9, textAlign: 'center' },

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
