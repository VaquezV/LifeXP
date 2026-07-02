# Evolutionary Theming System — Design Spec

**Date**: 2026-07-02  
**Project**: LifeXP  
**Scope**: Dynamic UI theming that evolves with user's wolf level progression (1-10), reflecting journey from darkness → organic nature → mystique/divinity

---

## Overview

The app's entire UI evolves dynamically as the user's wolf progresses through 10 levels. This visual transformation reflects the user's habit-tracking journey and creates a powerful sense of progression and achievement.

**Key principle**: No hard cuts at palier changes. Smooth CSS transitions between palettes create a continuous evolution feeling.

---

## System Architecture

### 1. Theming Engine

**10 discrete palettes** (one per wolf level 1-10), each defining:
- **Color palette** (background, surfaces, tints, accents, borders, success/warning/danger)
- **Depth system** (shadow elevations, layer opacity)
- **Saturation & warmth** (grayscale → vibrant, cool → warm)
- **Shape language** (borderRadius, curve intensity, organic flow)

**Implementation**: CSS custom properties (variables) organized per level:
```
--theme-level-N-bg-primary
--theme-level-N-bg-surface
--theme-level-N-shadow-elevation-1/2/3
--theme-level-N-saturation
--theme-level-N-border-radius-base
--theme-level-N-warmth
... (50+ vars per level)
```

Active palette applied via context/hook. UI components use variables instead of hardcoded values.

### 2. Data Model

**New table: `user_palette_progression`**
- `user_id` (UUID, PK+FK)
- `current_wolf_level` (INT 1-10)
- `last_seen_wolf_level` (INT 1-10) — tracks previous level for animation trigger
- `transition_date` (TIMESTAMP) — when the transition occurred
- `created_at`, `updated_at`

When `current_wolf_level` > `last_seen_wolf_level`, the app triggers celebration animation on next open.

### 3. Hook/Context for Active Palette

New hook: `useWolfLevelTheme()`
- Reads current wolf level from `user_palette_progression`
- Returns active CSS variable map for current level
- Subscribed to real-time updates (if level changes mid-session)

---

## The 10 Palettes: Progression

### Level 1: "Ombre Fermée" (Dark Closed)
**Vibe**: Exhausted, withdrawn, minimal light
- **Colors**: Deep blacks (#000), dark grays (#1a1a1a, #333), muted reds/oranges for accents
- **Shadows**: Minimal, flat, no elevation
- **Saturation**: Very desaturated, nearly grayscale
- **Warmth**: Cold, unwelcoming
- **Shapes**: Sharp corners (borderRadius: 4px), angular, closed-off feeling
- **Depth**: Single layer, no layering

### Levels 2-4: "Dégel Progressif" (Progressive Thaw)
**Vibe**: Slowly warming, gradual opening
- **Colors**: Gradual shift from grays → warm neutrals (taupe, warm brown tones)
- **Shadows**: Subtle elevation starting to appear
- **Saturation**: Begins to increase (30-50% saturation)
- **Warmth**: From cold → neutral → slightly warm
- **Shapes**: borderRadius gradually increases (4px → 8px → 12px)
- **Depth**: 2-3 subtle shadow layers emerging

### Levels 5-6: "Organique Naturel" (Organic Natural)
**Vibe**: Connected to nature, earthy, alive
- **Colors**: Sage greens (#6b9080), terracotta (#c17555), warm earth tones, soft golds
- **Shadows**: Warm-tinted shadows (not pure black)
- **Saturation**: Medium-high (60-75%)
- **Warmth**: Warm, inviting, natural
- **Shapes**: Rounded (borderRadius: 16px+), organic curves, breathing room
- **Depth**: Clear 3-4 layer system, shadows cast warmth

### Levels 7-8: "Épanouissement" (Blooming)
**Vibe**: Expansive, energetic, nature in bloom
- **Colors**: More vibrant greens (#2ec573), warm oranges (#f59e0b), blooming purples (#b06fd9)
- **Shadows**: More pronounced but still warm-tinted
- **Saturation**: High (75-90%)
- **Warmth**: Fully warm, inviting, alive
- **Shapes**: Very organic, flowing (borderRadius: 20px+, soft curves everywhere)
- **Depth**: 4-5 layers, clear hierarchy, breathing space

### Levels 9-10: "Mystique Divin" (Mystic Divine)
**Vibe**: Transcendent, magical, luminescent
- **Colors**: Deep rich purples (#7c3aed), iridescent blues (#00d9ff), glowing accents (#00ff88), gold hints (#ffd700)
- **Shadows**: Iridescent/color-shifted shadows (not gray), subtle glow effect
- **Saturation**: Very vibrant (90-100%), selective desaturation for depth
- **Warmth**: Balanced, mystical (cool accents with warm glows)
- **Shapes**: Ethereal, flowing (borderRadius: 24px+, soft transitions)
- **Depth**: 5+ layers, luminescence, subtle glow overlays, magical atmosphere

---

## Transition Animation Flow

### Scenario: User Opens App After Level Change

1. **Check trigger**: On app load, compare `current_wolf_level` vs `last_seen_wolf_level` in DB
2. **If changed**: Show celebration modal

### Celebration Modal (New Screen)
```
┌─────────────────────────────────┐
│                                 │
│    [Old Avatar overlaid]        │
│                                 │
│  "[Wolf Name] a évolué          │
│   grâce à toi! 🌟"              │
│                                 │
│    [ Continuer ]                │
│                                 │
└─────────────────────────────────┘
```

### Animation Sequence (on "Continuer" click)
1. **Avatar morphing** (500ms, smooth)
   - Old avatar → New avatar (lerp positions, opacity cross-fade)
   - Avatar scales into place as it morphs
   
2. **Avatar repositioning** (200ms)
   - Moves from modal center → app header position (if used)
   - Settles with a subtle bounce
   
3. **Palette fade transition** (400ms)
   - All CSS variables fade to new level's values
   - Entire UI recolors smoothly (background, surfaces, shadows, accents)
   - No jank; pure CSS transition on custom properties
   
4. **Modal dismisses** (200ms fade-out)
   - Celebration modal fades out
   - User now sees the app with new theme applied

5. **Update DB**
   - Set `last_seen_wolf_level = current_wolf_level`
   - Never show this animation again until next level change

---

## Component Updates Required

### 1. Theme Context & Hook
- New file: `lib/theme-evolution.ts` — palette definitions + interpolation logic
- Update `lib/theme-context.tsx` — integrate wolf level into active palette
- New hook: `useWolfLevelTheme()` — returns active palette + current level

### 2. Database Layer
- Create `user_palette_progression` table
- Add function: `fetchPaletteProgression(userId)` 
- Add function: `updatePaletteLevel(userId, newLevel)` — sets current_level + returns old level for animation
- RLS policies for user data isolation

### 3. UI Components
- Update `ThemedView`, `ThemedText`, all styled components — switch from hardcoded colors to CSS variables
- Existing Quasar/React Native theming hook should already use these if we pipe variables through it

### 4. Celebration Screen
- New component: `CelebrationModal` — shows old avatar, message, Continuer button
- Integrates avatar morphing animation
- Triggers palette transition on confirm

### 5. App Layout
- On root load (in `_layout.tsx` or RootNavigator), check for pending level transition
- If found, show CelebrationModal before rendering main app

---

## Technical Considerations

### CSS Variables in React Native
React Native doesn't natively support CSS variables. Approach:
- Define palette objects in TS (not CSS)
- Create context that provides current palette as object values
- Components access via hook: `const { colors, shadows } = useWolfLevelTheme()`
- Animations done via Reanimated for smooth interpolation (already in stack)

### Smooth Transitions Without Hard Cuts
- Use Reanimated's `withTiming` or Animated API to smoothly lerp between palettes
- Avoid jumping to discrete steps; ensure 400-500ms smooth fade

### Performance
- Palette objects cached/memoized
- Real-time subscription to DB changes (Supabase realtime) to catch level changes
- Animations are CSS/GPU-accelerated (no layout thrashing)

### Data Consistency
- RLS ensures users can only read/write their own progression data
- `last_seen_wolf_level` prevents animation spam; cleared after viewing celebration

---

## Files to Create/Modify

### New Files
- `lib/theme-evolution.ts` — palette definitions for all 10 levels
- `lib/hooks/use-wolf-level-theme.ts` — active palette hook
- `components/celebration-modal.tsx` — celebration UI + avatar morphing
- `migrations/add_user_palette_progression.sql` — DB schema

### Modified Files
- `lib/theme-context.tsx` — integrate wolf level
- `app/_layout.tsx` — check for level change, show modal
- All styled components — switch to CSS variables via theme hook
- `constants/theme.ts` — consolidate with new theme-evolution.ts or migrate values

### Deprecated
- Existing theme constants may be refactored into theme-evolution.ts

---

## Success Criteria

1. ✓ UI smoothly transitions between palettes when wolf level changes
2. ✓ No hard cuts; 400-500ms fade transition applies to all elements
3. ✓ Celebration animation plays once per level change, never duplicated
4. ✓ Old avatar morphs to new avatar with visual delight
5. ✓ App feels responsive; no jank during palette changes
6. ✓ All 10 levels visually distinct, following progression (dark → nature → mystique)
7. ✓ RLS protects user data; users only see their own progression

---

## Appendix: Palette Color Reference

(Specific hex values TBD after visual design pass, but structure above defines the progression.)

Example Level 1 (Ombre Fermée):
```
bg-primary: #000000
surface: #0a0a0a
shadow: rgba(0, 0, 0, 0.8)
accent: #4a3a3a (muted red-brown)
text: #666666
```

Example Level 10 (Mystique Divin):
```
bg-primary: #0a0415 (deep purple-black)
surface: #16082a (rich purple)
shadow: rgba(124, 58, 237, 0.3) (iridescent purple)
accent: #00ff88 (glowing green)
text: #e0d9ff (light lavender)
glow: #7c3aed (iridescent accent)
```

Full palette charts to be designed in implementation phase.
