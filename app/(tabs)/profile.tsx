import { ThemedText } from '@/components/themed-text';
import { ProfileHeader, HabitCard, GamificationExplainer } from '@/components/profile-redesign';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import { defaultAllCategoryProgress, fetchCategoryProgress } from '@/lib/category-progress';
import { fetchWolfName, saveWolfName } from '@/lib/profiles';
import { fetchScoringConfig, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import { useThemeContext } from '@/lib/theme-context';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { CATEGORY_KEYS } from '@/lib/types';
import {
  computeTotalXP,
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


export default function ProfileScreen() {
  const theme = useWolfLevelTheme();
  const { toggleTheme, mode } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<Record<CategoryType, CategoryProgress> | null>(null);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>(SCORING_CONFIG_FALLBACK);
  const [wolfName, setWolfName] = useState('Loup Sans Nom');
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [explainerVisible, setExplainerVisible] = useState(false);

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
        <ActivityIndicator size="large" color={theme.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, themeStyles.screen]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <ThemedText style={[styles.headerTitle, { color: theme.tint }]}>Life XP</ThemedText>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
            <ThemedText style={[styles.themeBtnText, { color: theme.textMuted }]}>
              {mode === 'dark' ? '☀' : '🌙'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          avatarScore={avatarScore}
          wolfName={wolfName}
          wolfClass={wolfClass}
          tierIndex={tierIndex}
          totalXP={totalXP}
          onEditName={openNameModal}
          onHelpPress={() => setExplainerVisible(true)}
          categoryProgress={progress}
          scoringConfigs={scoringConfigs}
        />

        {/* Habit Cards */}
        <View style={[styles.habitsContainer, { backgroundColor: theme.surface }]}>
          {CATEGORY_KEYS.map((category) => (
            <HabitCard
              key={category}
              category={category}
              categoryProgress={progress[category]}
              scoringConfigs={scoringConfigs}
            />
          ))}
        </View>

        {/* Modal édition nom */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
            <Pressable style={[styles.modalBox, { backgroundColor: theme.surface }]} onPress={() => {}}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Nom du loup</ThemedText>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                maxLength={30}
                autoFocus
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalSave, { backgroundColor: theme.tint }]}
              >
                <ThemedText style={styles.modalSaveLabel}>Sauvegarder</ThemedText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Gamification Explainer Modal */}
        <GamificationExplainer
          visible={explainerVisible}
          onClose={() => setExplainerVisible(false)}
        />

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

  habitsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },

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
