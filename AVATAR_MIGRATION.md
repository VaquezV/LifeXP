# Avatar System Refactoring

This document outlines the new avatar system structure and how to use it.

## New Structure

### File Organization

```
lifexp/
├── lib/avatars/           # Avatar logic and configuration
│   ├── config.ts          # Emotional states and colors
│   ├── types.ts           # TypeScript types
│   ├── useAvatar.ts       # Hook for avatar logic
│   └── index.ts           # Exports
├── components/avatar/     # Avatar components
│   ├── avatar.tsx         # Main Avatar component
│   ├── weekly-mascot.tsx  # Default animated SVG avatar (deprecated)
│   ├── svg-avatar-loader.tsx  # Loader for external SVGs
│   └── index.ts           # Exports
└── assets/avatars/        # External SVG files (to be added)
    └── README.md          # Instructions for adding new avatars
```

## Usage

### Default Avatar (Weekly Mascot)

```tsx
import { Avatar } from '@/components/avatar';

export function MyComponent() {
  return <Avatar score={75} size="medium" />;
}
```

### Sizes

- `small`: 120x130
- `medium`: 180x200 (default)
- `large`: 240x270

### Accent Colors

```tsx
<Avatar score={75} accentColor="#ff6b6b" size="large" />
```

## Migration Path

### Step 1: Prepare SVG Files

Create SVG files following this naming pattern:
```
assets/avatars/{avatar-name}.{state}.svg
```

States:
- exhausted
- sad
- neutral
- content
- happy
- epic

### Step 2: Update Avatar Configuration

Add new avatar entries to `lib/avatars/config.ts`:

```ts
export const AVATAR_SOURCES = {
  mascot: {
    id: 'mascot',
    name: 'Weekly Mascot',
    version: '1.0',
    emotionalStates: {
      exhausted: 'mascot.exhausted.svg',
      sad: 'mascot.sad.svg',
      neutral: 'mascot.neutral.svg',
      content: 'mascot.content.svg',
      happy: 'mascot.happy.svg',
      epic: 'mascot.epic.svg',
    },
  },
  // Add more avatars here
};
```

### Step 3: Create Avatar Component

Create a new component that uses `SVGAvatarLoader`:

```tsx
import { SVGAvatarLoader } from './svg-avatar-loader';
import { AVATAR_SOURCES } from '@/lib/avatars';

interface CustomAvatarProps {
  score: number;
  accentColor?: string;
}

export function CustomAvatar({ score, accentColor = '#2a9d8f' }: CustomAvatarProps) {
  const { state } = useAvatar({ score, accentColor });
  const svgPath = AVATAR_SOURCES.mascot.emotionalStates[state];

  return (
    <SVGAvatarLoader
      svgPath={svgPath}
      state={state}
      accentColor={accentColor}
    />
  );
}
```

## Emotional States & Colors

### States by Score Range

| State | Range | Color | Description |
|-------|-------|-------|-------------|
| exhausted | 0-20% | #8b3a3a | Barely alive |
| sad | 20-40% | #7a5c7c | Low energy |
| neutral | 40-60% | #6b7a8a | Meh |
| content | 60-80% | #4a9b7f | Small smile |
| happy | 80-95% | #2ec573 | Energetic |
| epic | 95-100% | #00ff88 | Maximum hype |

### Using Colors in SVG

SVG files can use the accent color for dynamic coloring:
```svg
<circle fill="var(--accent-color)" cx="120" cy="120" r="50" />
```

## Next Steps

1. Create SVG files for new avatars in `assets/avatars/`
2. Update `lib/avatars/config.ts` with avatar sources
3. Update `components/avatar/svg-avatar-loader.tsx` to load SVGs
4. Replace `WeeklyMascot` usage with `SVGAvatarLoader`

## Benefits of This Structure

✅ Modular and maintainable code  
✅ Easy to add new avatars without code changes  
✅ Centralized configuration  
✅ Type-safe avatar system  
✅ Separation of concerns  
✅ Future-proof for SVG animations and customizations
