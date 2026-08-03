import { ThemedText } from '@/components/themed-text';
import { ProfileHeader, SanctuaryCategoryCard, GamificationExplainer } from '@/components/profile-redesign';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';
import { getReadableTextColor } from '@/lib/theme-evolution';
import { getAvatarScoreFromLevels } from '@/lib/avatar-level';
import { defaultAllCategoryProgress, fetchCategoryProgress } from '@/lib/category-progress';
import { fetchWolfName, saveWolfName } from '@/lib/profiles';
import { fetchScoringConfig, SCORING_CONFIG_FALLBACK } from '@/lib/scoring-config';
import type { CategoryProgress, CategoryType, ScoringConfig } from '@/lib/types';
import { CATEGORY_KEYS } from '@/lib/types';
import {
  computeTotalXP,
  getNextClass,
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
  const themeStyles = { screen: { backgroundColor: theme.bgPrimary } };
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
  const nextClass      = getNextClass(avatarScore);

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
          <View>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>SANCTUAIRE</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textMuted }]}>Ton territoire prend vie grâce à tes habitudes.</ThemedText>
          </View>
          <Pressable
            onPress={() => setExplainerVisible(true)}
            style={[styles.helpButton, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Comprendre la progression"
          >
            <ThemedText style={[styles.helpIcon, { color: theme.tint }]}>?</ThemedText>
          </Pressable>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          avatarScore={avatarScore}
          wolfName={wolfName}
          wolfClass={wolfClass}
          tierIndex={tierIndex}
          totalXP={totalXP}
          nextClass={nextClass}
          categoryProgress={progress}
          onEditName={openNameModal}
        />

        <View style={[styles.habitsContainer, { backgroundColor: theme.bgPrimary }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>LES DOMAINES DE TON SANCTUAIRE</ThemedText>
          <View style={styles.cardsGrid}>
            {CATEGORY_KEYS.map((category) => (
              <SanctuaryCategoryCard
                key={category}
                category={category}
                categoryProgress={progress[category]}
                scoringConfigs={scoringConfigs}
              />
            ))}
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
                <ThemedText style={[styles.modalSaveLabel, { color: getReadableTextColor(theme.tint) }]}>Sauvegarder</ThemedText>
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
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1.4 },
  headerSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { fontSize: 18, lineHeight: 22, fontWeight: '800' },

  habitsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  cardsGrid: { gap: 12 },

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
  modalSaveLabel: { fontWeight: '700', fontSize: 15 },
});
