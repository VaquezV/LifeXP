import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useWolfLevelTheme } from '@/lib/hooks/use-wolf-level-theme';

interface GamificationExplainerProps {
  visible: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'points',
    title: 'Comment fonctionnent les points ?',
    content: [
      'Chaque habitude a un objectif défini (par ex. 65 pts pour Antre des Racines)',
      'Complétez vos tâches quotidiennes pour gagner des points',
      'La barre de progression se remplit à mesure que vous accumulez des points',
      'Atteignez 100% pour passer au niveau suivant',
      'Plus vous progressez, plus les objectifs augmentent',
    ],
  },
  {
    id: 'levels',
    title: 'Niveaux du Loup (1-10)',
    content: [
      'Votre loup évolue visuellement à chaque niveau',
      'Les niveaux reflètent votre progression globale dans toutes les habitudes',
      'Débloquez des transformations visuelles à chaque jalon',
      'Le niveau affecte le thème de couleurs de l\'application',
      'Chaque niveau a sa propre essence : de l\'ombre fermée à la mystique divine',
    ],
  },
  {
    id: 'xp',
    title: 'XP et Progression',
    content: [
      'L\'XP total est la somme de tous les points de vos habitudes',
      'Compléter vos habitudes = progression plus rapide',
      'Votre XP total s\'affiche dans la section Niveau',
      'Chaque habitude contribue au score global du loup',
      'Pas de limite : continuez à progresser indéfiniment',
    ],
  },
  {
    id: 'status',
    title: 'Statuts et Indicateurs',
    content: [
      'Vert (Succès) = habitude complétée ou en excellent état',
      'Orange (Attention) = habitude a besoin d\'attention',
      'Rouge (Critique) = habitude très en retard sur l\'objectif',
      'Chaque habitude a sa propre barre de progression',
      'Suivez vos 4 domaines : Auto-soin, Développement, Famille, Pro',
    ],
  },
];

export function GamificationExplainer({
  visible,
  onClose,
}: GamificationExplainerProps) {
  const theme = useWolfLevelTheme();
  const [expandedId, setExpandedId] = useState<string | null>('points');

  const toggleSection = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.overlay,
          { backgroundColor: theme.overlay },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalContainer,
            { backgroundColor: theme.surface },
          ]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText
              style={[
                styles.title,
                { color: theme.text },
              ]}
            >
              Système de Progression
            </ThemedText>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
            >
              <ThemedText
                style={[
                  styles.closeIcon,
                  { color: theme.textMuted },
                ]}
              >
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {SECTIONS.map((section) => (
              <SectionItem
                key={section.id}
                section={section}
                isExpanded={expandedId === section.id}
                onToggle={() => toggleSection(section.id)}
                theme={theme}
              />
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface SectionItemProps {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  theme: any;
}

function SectionItem({
  section,
  isExpanded,
  onToggle,
  theme,
}: SectionItemProps) {
  return (
    <View
      style={[
        styles.sectionContainer,
        {
          borderBottomColor: theme.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.sectionHeader}
      >
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: theme.text },
          ]}
        >
          {section.title}
        </ThemedText>
        <ThemedText
          style={[
            styles.expandIcon,
            {
              color: theme.tint,
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            },
          ]}
        >
          ▼
        </ThemedText>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.contentContainer}>
          {section.content.map((line, idx) => (
            <View key={idx} style={styles.bulletPoint}>
              <ThemedText
                style={[
                  styles.bullet,
                  { color: theme.tint },
                ]}
              >
                •
              </ThemedText>
              <ThemedText
                style={[
                  styles.contentText,
                  { color: theme.textSubtle },
                ]}
              >
                {line}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  contentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
