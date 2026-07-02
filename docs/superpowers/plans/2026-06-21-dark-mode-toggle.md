# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Force dark mode by default and add a sun/moon icon button in the top-right of AppHeader to toggle light mode.

**Architecture:** Introduce a `ThemeContext` that holds the current `ThemeMode` (init: `'dark'`) and a `toggleTheme()` function. `useColorScheme` reads from this context instead of returning a hardcoded value. `AppHeader` gets a `MaterialIcons` icon button on the right. The react-navigation `ThemeProvider` in `_layout.tsx` switches between `DarkTheme` and `DefaultTheme` dynamically.

**Tech Stack:** React Context, React Native `TouchableOpacity`, `MaterialIcons` (already installed via `@expo/vector-icons`), `@react-navigation/native` `DarkTheme`/`DefaultTheme`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/theme-context.tsx` | ThemeMode state + toggleTheme(), ThemeContextProvider |
| Modify | `hooks/use-color-scheme.ts` | Read from ThemeContext instead of hardcoded `'dark'` |
| Modify | `app/_layout.tsx` | Wrap with ThemeContextProvider; dynamic nav theme + StatusBar |
| Modify | `components/app-header.tsx` | Add icon toggle button on the right |

---

### Task 1: Create ThemeContext

**Files:**
- Create: `lib/theme-context.tsx`

- [ ] **Step 1: Create the context file**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ThemeMode } from '@/constants/theme';

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggleTheme: () => {},
});

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /home/zbulon/Projets/Code/LifeXP && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add lib/theme-context.tsx
git commit -m "feat: add ThemeContext with dark default and toggleTheme"
```

---

### Task 2: Wire ThemeContextProvider into _layout.tsx

**Files:**
- Modify: `app/_layout.tsx`

Current content of `app/_layout.tsx`:
```tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
// ...
import { AuthProvider, useAuth } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-app-theme';

function RootNavigator() { ... }

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <RootNavigator />
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 1: Update _layout.tsx to use ThemeContextProvider and dynamic nav theme**

Replace the entire file content with:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ThemeContextProvider, useThemeContext } from '@/lib/theme-context';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors, styles: themeStyles } = useAppTheme();
  const { mode } = useThemeContext();

  useEffect(() => {
    if (loading) return;
    const inAuthFlow = segments[0] === 'login' || segments[0] === 'auth';
    if (!session && !inAuthFlow) {
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={[themeStyles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeContextProvider>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /home/zbulon/Projets/Code/LifeXP && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: dynamic navigation theme driven by ThemeContext"
```

---

### Task 3: Update useColorScheme (both native and web) to read from ThemeContext

**Files:**
- Modify: `hooks/use-color-scheme.ts`
- Modify: `hooks/use-color-scheme.web.ts`

Both files must read from `ThemeContext`. The `.web.ts` file is a platform override that currently ignores our hardcoded value — if left unchanged it would use the system color scheme on web instead of the user's toggle choice.

- [ ] **Step 1: Update use-color-scheme.ts**

Replace the entire file content with:

```ts
import { useThemeContext } from '@/lib/theme-context';

export function useColorScheme(): 'light' | 'dark' | null {
  const { mode } = useThemeContext();
  return mode;
}
```

- [ ] **Step 2: Update use-color-scheme.web.ts**

Replace the entire file content with:

```ts
import { useThemeContext } from '@/lib/theme-context';

export function useColorScheme(): 'light' | 'dark' | null {
  const { mode } = useThemeContext();
  return mode;
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd /home/zbulon/Projets/Code/LifeXP && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/use-color-scheme.ts hooks/use-color-scheme.web.ts
git commit -m "feat: useColorScheme reads from ThemeContext on all platforms"
```

---

### Task 4: Add toggle button to AppHeader

**Files:**
- Modify: `components/app-header.tsx`

The current `AppHeader` shows just a title left-aligned. We add a `TouchableOpacity` + `MaterialIcons` icon on the right.
- In dark mode: show `wb-sunny` icon (sun → switch to light)
- In light mode: show `brightness-3` icon (moon → switch to dark)

- [ ] **Step 1: Update app-header.tsx**

Replace the entire file content with:

```tsx
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from '@/hooks/use-translation';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeContext } from '@/lib/theme-context';
import { ThemedText } from './themed-text';

export interface AppHeaderProps {
  weeklyScore?: number;
}

export function AppHeader({ weeklyScore }: AppHeaderProps) {
  const { colors, styles: themeStyles } = useAppTheme();
  const { t } = useTranslation();
  const { mode, toggleTheme } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        themeStyles.surface,
        themeStyles.dividerBottom,
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {t('lifeXP')}
        </ThemedText>
        <TouchableOpacity onPress={toggleTheme} style={styles.toggleButton} hitSlop={8}>
          <MaterialIcons
            name={mode === 'dark' ? 'wb-sunny' : 'brightness-3'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 32,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
  },
  toggleButton: {
    padding: 4,
  },
});
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /home/zbulon/Projets/Code/LifeXP && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/app-header.tsx
git commit -m "feat: add dark/light mode toggle button to AppHeader"
```

---

### Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd /home/zbulon/Projets/Code/LifeXP && npx expo start
```

- [ ] **Step 2: Verify dark mode on launch**

Open the app. It should open in dark mode (black background, white text). No change from before.

- [ ] **Step 3: Tap the sun icon in the header**

The app should switch to light mode (white background, dark text). The icon in the header should change to a moon.

- [ ] **Step 4: Tap the moon icon**

The app should switch back to dark mode. The icon should change back to a sun.

- [ ] **Step 5: Verify tab bar and navigation chrome update**

The tab bar and navigation chrome should also switch colors (dark/light nav theme).
