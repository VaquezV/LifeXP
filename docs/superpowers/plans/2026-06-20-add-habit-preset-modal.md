# Add Habit — Preset Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un bouton "Ajouter une nouvelle habitude" en bas de la liste et ouvrir un modal 3 étapes (preset → niveau → formulaire pré-rempli).

**Architecture:** Un nouveau composant `AddHabitModal` gère les 3 étapes en état local. `index.tsx` charge les presets au montage, passe `onAddHabit` au modal, et ajoute le bouton comme dernier item de la FlatList. `CategorySection` n'est pas modifié (son bouton "Add" reste inerte, `onAddHabit` n'étant toujours pas passé depuis `index.tsx`).

**Tech Stack:** React Native, TypeScript, Supabase (`preset_habits` table + `createHabit`)

---

## Fichiers touchés

| Action  | Fichier                                    | Rôle                                         |
|---------|--------------------------------------------|----------------------------------------------|
| Créer   | `components/add-habit-modal.tsx`           | Modal 3 étapes : preset → niveau → formulaire |
| Modifier | `app/(tabs)/index.tsx`                    | Charger presets, bouton en bas de FlatList, handler `onAddHabit` |
| Supprimer (optionnel) | `components/add-habit-card.tsx` | Unused — peut rester, ne pas toucher         |

---

## Task 1 : Composant `AddHabitModal` — squelette 3 étapes

**Fichier :** `components/add-habit-modal.tsx` (créer)

- [ ] Créer le fichier avec les imports (`Modal`, `ScrollView`, `Pressable`, `TextInput`, `useState`, `PresetHabit`, `CategoryType`, `CATEGORY_COLORS`, `MaterialIcons`).

- [ ] Déclarer les props :
  ```ts
  interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (habit: { name: string; emoji: string; category: CategoryType; frequency_type: string; target_value: number; min_value: number; preset_habit_id: string | null }) => Promise<void>;
    presets: PresetHabit[];  // passé depuis index.tsx, déjà chargé
  }
  ```

- [ ] Déclarer l'état interne :
  ```ts
  type Step = 'picker' | 'level' | 'form';
  const [step, setStep] = useState<Step>('picker');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetHabit | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '⭐', category: 'self_care' as CategoryType, frequency_type: 'per_day', target_value: 60, min_value: 30 });
  ```

- [ ] Ajouter une fonction `resetAndClose` qui remet step à `'picker'`, vide les sélections et appelle `onClose`.

- [ ] Retourner `<Modal visible={visible} transparent animationType="slide">` avec un overlay + container bottom-sheet vide (juste le titre + bouton close). Vérifier visuellement que le modal s'ouvre et se ferme.

- [ ] **Commit :** `feat: add AddHabitModal skeleton with 3-step state`

---

## Task 2 : Étape 1 — Picker de presets

**Fichier :** `components/add-habit-modal.tsx`

- [ ] Calculer la liste des noms uniques triés depuis `presets` :
  ```ts
  const uniqueNames = [...new Set(presets.map(p => p.name))].sort();
  ```

- [ ] Rendre, quand `step === 'picker'` :
  - Un titre "Choisir une habitude"
  - Une `ScrollView` avec une `Pressable` par nom unique → `setSelectedName(name); setStep('level')`
  - Un bouton "Créer manuellement" en bas → `setStep('form')` sans preset

- [ ] **Commit :** `feat: add preset picker step to AddHabitModal`

---

## Task 3 : Étape 2 — Sélection du niveau

**Fichier :** `components/add-habit-modal.tsx`

- [ ] Calculer les variantes disponibles pour le nom sélectionné :
  ```ts
  const variants = presets.filter(p => p.name === selectedName);
  ```

- [ ] Labels d'affichage pour chaque valeur d'expertise :
  ```ts
  const EXPERTISE_LABELS: Record<string, string> = {
    debutant: 'Débutant', intermediaire: 'Intermédiaire', expert: 'Expert',
    enfant: 'Enfant', ado: 'Ado', adulte_homme: 'Adulte (H)',
    adulte_femme: 'Adulte (F)', standard: 'Standard',
  };
  ```

- [ ] Rendre, quand `step === 'level'` :
  - Titre : nom sélectionné
  - Chips horizontaux pour chaque variante → au tap : `setSelectedPreset(variant)` puis pré-remplir `form` avec les valeurs du preset, puis `setStep('form')`
  - Bouton retour "←" qui remet `step` à `'picker'`

- [ ] **Commit :** `feat: add expertise level picker step to AddHabitModal`

---

## Task 4 : Étape 3 — Formulaire pré-rempli

**Fichier :** `components/add-habit-modal.tsx`

- [ ] Rendre, quand `step === 'form'`, les champs suivants (chaque champ `TextInput` est désactivé si le preset dit `editable_* = false`) :
  - Emoji (petit `TextInput` centré, `maxLength={2}`)
  - Nom (`TextInput`)
  - Catégorie (4 chips correspondant aux `CategoryType`, pré-sélectionné si preset)
  - Fréquence : 3 chips `per_day / times_per_day / times_per_week` (désactivé si `!selectedPreset?.editable_frequency_type`)
  - Target value (`TextInput` numérique, désactivé si `!selectedPreset?.editable_target_value`)
  - Min value (affiché uniquement si `frequency_type === 'per_day'`, désactivé si `!selectedPreset?.editable_min_value`)

- [ ] Ajouter les boutons "Annuler" et "Sauvegarder". Sur save : appeler `onSave({ ...form, preset_habit_id: selectedPreset?.id ?? null })` puis `resetAndClose()`.

- [ ] **Commit :** `feat: add pre-filled form step to AddHabitModal`

---

## Task 5 : Bouton en bas + branchement dans `index.tsx`

**Fichier :** `app/(tabs)/index.tsx`

- [ ] Importer `fetchPresetHabits` depuis `@/lib/preset-habits` et `AddHabitModal` depuis `@/components/add-habit-modal`.

- [ ] Ajouter les états :
  ```ts
  const [presets, setPresets] = useState<PresetHabit[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  ```

- [ ] Dans le `useEffect` existant (chargement des données), ajouter `fetchPresetHabits()` en parallèle et stocker dans `setPresets`.

- [ ] Ajouter `'add-habit'` comme dernier item dans le tableau `data` de la `FlatList` :
  ```ts
  data={['app-header', 'week-header', ...categories.map(cat => cat.key), 'add-habit']}
  ```

- [ ] Dans le `renderItem` de la FlatList, ajouter le cas `'add-habit'` :
  - Affiche une `Pressable` stylée (fond neutre, icône `+`, texte "Ajouter une nouvelle habitude")
  - `onPress={() => setAddModalVisible(true)}`

- [ ] Implémenter le handler `handleAddHabit` :
  ```ts
  const handleAddHabit = async (habitData) => {
    const userId = await requireUserId();
    const newHabit = await createHabit({ ...habitData, user_id: userId });
    setHabits(prev => [...prev, newHabit]);
  };
  ```

- [ ] Ajouter le composant `<AddHabitModal>` juste avant la fermeture du `<SafeAreaView>` :
  ```tsx
  <AddHabitModal
    visible={addModalVisible}
    onClose={() => setAddModalVisible(false)}
    onSave={handleAddHabit}
    presets={presets}
  />
  ```

- [ ] Importer `createHabit` depuis `@/lib/habits`.

- [ ] **Commit :** `feat: wire AddHabitModal into HomeScreen with preset loading`

---

## Task 6 : Styles et polish

**Fichier :** `components/add-habit-modal.tsx`

- [ ] S'assurer que le modal est un bottom-sheet (overlay sombre, container arrondi en haut, `maxHeight: '90%'`). Copier le style de `habit-modal.tsx` pour la cohérence.

- [ ] Le bouton "Ajouter une nouvelle habitude" dans la FlatList doit avoir un style cohérent : centré, icône `add-circle-outline`, couleur neutre. Copier le style du bouton dans `add-habit-card.tsx` si besoin.

- [ ] Vérifier dark mode (tester `isDark` sur les backgrounds et couleurs de texte).

- [ ] **Commit :** `style: polish AddHabitModal layout and dark mode`

---

## Vérification finale

- [ ] Taper sur "Ajouter une nouvelle habitude" → modal s'ouvre sur la liste des presets
- [ ] Choisir "Sommeil" → niveau apparaît (débutant / intermédiaire / expert)
- [ ] Choisir un niveau → formulaire pré-rempli, champs non-éditables grisés
- [ ] Sauvegarder → habitude apparaît dans la bonne catégorie sans recharger la page
- [ ] Taper "Créer manuellement" → formulaire vide avec tous les champs éditables
- [ ] Fermer le modal → état remis à zéro (retour à l'étape 1 à la prochaine ouverture)
