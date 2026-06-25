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

  const avatarScore = getAvatarScoreFromLevels(levels);
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
    try {
      await saveWolfName(trimmed);
      setWolfName(trimmed);
      setModalVisible(false);
    } catch {
      // saveWolfName a échoué — on garde le modal ouvert, nom inchangé
      setModalVisible(false);
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
        <View style={[styles.accessoryRow, { borderBottomColor: colors.border }]}>
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
