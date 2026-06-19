# Google OAuth + RLS + Migration + Audit sécurité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une authentification Google OAuth (Web + Android) à LifeXP, sécuriser Supabase avec RLS par utilisateur, migrer les données existantes vers le compte réel, et produire un audit de sécurité.

**Architecture:** Flow OAuth PKCE via `expo-web-browser` (un seul chemin Web + natif, Expo managed). Session persistée chiffrée (`expo-secure-store` natif via adaptateur chunké, `localStorage` Web). RLS Postgres `auth.uid() = user_id` sur toutes les tables utilisateur. Migration de données par script SQL one-shot après première connexion.

**Tech Stack:** Expo (React Native + Web), expo-router, @supabase/supabase-js v2, expo-web-browser, expo-auth-session, expo-secure-store, jest-expo (tests unitaires).

**Spec:** [docs/superpowers/specs/2026-06-20-google-oauth-rls-design.md](../specs/2026-06-20-google-oauth-rls-design.md)

---

## File Structure

| Fichier | Responsabilité | Action |
|---|---|---|
| `lib/secure-storage.ts` | Adaptateur de stockage chiffré plateforme-conscient (chunké) | Create |
| `lib/secure-storage.test.ts` | Tests de l'adaptateur (chunking) | Create |
| `lib/supabase.ts` | Client Supabase (session persistée, PKCE, auto-refresh AppState) | Modify |
| `lib/auth.tsx` | `AuthProvider`, `useAuth`, `signInWithGoogle`, `signOut`, `requireUserId` | Create |
| `lib/auth.test.ts` | Tests de `requireUserId` et du calcul de redirect URI | Create |
| `app/login.tsx` | Écran de connexion Google | Create |
| `app/_layout.tsx` | Provider Auth + garde de route | Modify |
| `lib/checkins.ts` | Remplacement `SINGLE_USER_ID` → `requireUserId()` | Modify |
| `lib/habits.ts` | idem | Modify |
| `lib/habit-operations.ts` | idem | Modify |
| `lib/categories.ts` | idem (+ note : table `categories` inexistante) | Modify |
| `supabase/migrations/20260620_enable_rls.sql` | Activation RLS + policies par utilisateur | Create |
| `supabase/migrations/20260620_migrate_single_user_data.sql` | Réassignation données placeholder → compte réel | Create |
| `supabase/schema.sql` | Refléter l'état RLS activé | Modify |
| `.gitignore` | Ignorer `.env`, `*.apk` | Modify |
| `package.json` | Scripts de test, deps | Modify |
| `jest.config.js` / `jest.setup.js` | Config jest-expo | Create |
| `docs/superpowers/specs/2026-06-20-security-audit-report.md` | Rapport d'audit | Create |

---

## Task 0: Installer les dépendances et l'infra de test

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`, `jest.setup.js`

- [ ] **Step 1: Installer les dépendances runtime**

Run:
```bash
npx expo install expo-auth-session expo-secure-store @react-native-async-storage/async-storage
```
(`expo-web-browser` et `expo-crypto` arrivent en transitif/déjà présents ; `async-storage` reste utile comme fallback web par défaut de certains modules.)

- [ ] **Step 2: Installer les dépendances de test**

Run:
```bash
npm install --save-dev jest jest-expo @types/jest react-test-renderer
```
Expected: installation sans erreur.

- [ ] **Step 3: Créer `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@supabase/.*|react-navigation|@react-navigation/.*))',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};
```

- [ ] **Step 4: Créer `jest.setup.js`**

```js
// Mocks par défaut pour les modules natifs Expo dans les tests unitaires.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

- [ ] **Step 5: Ajouter le script de test à `package.json`**

Dans `"scripts"`, ajouter :
```json
"test": "jest"
```

- [ ] **Step 6: Vérifier que jest démarre**

Run: `npm test -- --passWithNoTests`
Expected: `No tests found, exiting with code 0` (ou équivalent succès).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.js
git commit -m "chore: ajoute deps auth + infra de test jest-expo"
```

---

## Task 1: Adaptateur de stockage chiffré chunké

**Files:**
- Create: `lib/secure-storage.ts`
- Test: `lib/secure-storage.test.ts`

Contexte : SecureStore limite chaque valeur à ~2048 octets. On découpe les grandes valeurs en chunks. Sur Web, on délègue à `localStorage`.

- [ ] **Step 1: Écrire le test (chunking aller-retour)**

`lib/secure-storage.test.ts`:
```ts
import { chunkValue, reassembleChunks, CHUNK_SIZE } from './secure-storage';

describe('chunkValue / reassembleChunks', () => {
  it('découpe une valeur plus grande que CHUNK_SIZE et la reconstitue', () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10);
    const chunks = chunkValue(value);
    expect(chunks.length).toBe(3);
    expect(reassembleChunks(chunks)).toBe(value);
  });

  it('gère une petite valeur en un seul chunk', () => {
    const value = 'hello';
    const chunks = chunkValue(value);
    expect(chunks.length).toBe(1);
    expect(reassembleChunks(chunks)).toBe(value);
  });

  it('reconstitue une liste vide en chaîne vide', () => {
    expect(reassembleChunks([])).toBe('');
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `npm test -- secure-storage`
Expected: FAIL — `chunkValue is not a function` (module pas encore écrit).

- [ ] **Step 3: Implémenter `lib/secure-storage.ts`**

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore impose ~2048 octets par valeur ; on garde une marge.
export const CHUNK_SIZE = 1800;

export function chunkValue(value: string): string[] {
  if (value.length === 0) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export function reassembleChunks(chunks: string[]): string {
  return chunks.join('');
}

function countKey(key: string) {
  return `${key}__chunks`;
}
function chunkKey(key: string, index: number) {
  return `${key}__${index}`;
}

async function setNative(key: string, value: string): Promise<void> {
  const chunks = chunkValue(value);
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
  );
}

async function getNative(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(countKey(key));
  if (countRaw == null) return null;
  const count = Number(countRaw);
  const chunks: string[] = [];
  for (let i = 0; i < count; i++) {
    chunks.push((await SecureStore.getItemAsync(chunkKey(key, i))) ?? '');
  }
  return reassembleChunks(chunks);
}

async function removeNative(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(countKey(key));
  if (countRaw == null) return;
  const count = Number(countRaw);
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.deleteItemAsync(countKey(key));
}

// Adaptateur conforme à l'interface storage attendue par supabase-js.
export const secureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
      );
    }
    return getNative(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return setNative(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return removeNative(key);
  },
};
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `npm test -- secure-storage`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/secure-storage.ts lib/secure-storage.test.ts
git commit -m "feat: adaptateur de stockage chiffré chunké (secure-store/localStorage)"
```

---

## Task 2: Reconfigurer le client Supabase

**Files:**
- Modify: `lib/supabase.ts`

- [ ] **Step 1: Réécrire `lib/supabase.ts`**

Remplacer l'intégralité du fichier par :
```ts
import 'react-native-url-polyfill/auto';

import { Platform, AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { secureStorageAdapter } from './secure-storage';

// Conservé uniquement pour le script de migration des anciennes données.
export const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000000';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_SETUP_MESSAGE =
  'Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans un fichier .env.';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: secureStorageAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

// Sur natif, démarre/arrête l'auto-refresh selon l'état de l'app.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur liée à `lib/supabase.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: session Supabase persistée chiffrée + PKCE + auto-refresh"
```

---

## Task 3: Couche Auth — `requireUserId` (TDD)

**Files:**
- Create: `lib/auth.tsx`
- Test: `lib/auth.test.ts`

- [ ] **Step 1: Écrire le test de `requireUserId`**

`lib/auth.test.ts`:
```ts
import { requireUserId } from './auth';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from './supabase';

const getSession = (supabase as any).auth.getSession as jest.Mock;

describe('requireUserId', () => {
  it('retourne l\'id utilisateur quand une session existe', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } });
    await expect(requireUserId()).resolves.toBe('user-123');
  });

  it('lève une erreur quand aucune session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(requireUserId()).rejects.toThrow('Utilisateur non authentifié');
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `npm test -- auth`
Expected: FAIL — module `./auth` introuvable.

- [ ] **Step 3: Créer `lib/auth.tsx` (partie testée d'abord)**

Créer le fichier avec, au minimum, `requireUserId` exporté :
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function requireUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Utilisateur non authentifié');
  return id;
}

export function getRedirectUri(): string {
  // Web : origin courant ; natif : deep-link scheme lifexp://
  return makeRedirectUri({ scheme: 'lifexp', path: 'auth/callback' });
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Supabase non configuré');
    const redirectTo = getRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) throw error;
    if (Platform.OS === 'web') return; // redirection gérée par le navigateur

    const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
    if (result.type !== 'success' || !result.url) return;
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `npm test -- auth`
Expected: PASS (2 tests).

- [ ] **Step 5: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur `lib/auth.tsx`.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.tsx lib/auth.test.ts
git commit -m "feat: AuthProvider, useAuth, signInWithGoogle, requireUserId"
```

---

## Task 4: Écran de connexion

**Files:**
- Create: `app/login.tsx`

- [ ] **Step 1: Créer `app/login.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LifeXP</Text>
      <Text style={styles.subtitle}>Connecte-toi pour accéder à tes données.</Text>
      <Pressable style={styles.button} onPress={handlePress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#05070a" />
        ) : (
          <Text style={styles.buttonText}>Continuer avec Google</Text>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#05070a', padding: 24 },
  title: { color: '#fff', fontSize: 36, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#9aa4b2', fontSize: 15, marginBottom: 32, textAlign: 'center' },
  button: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, minWidth: 240, alignItems: 'center' },
  buttonText: { color: '#05070a', fontSize: 16, fontWeight: '600' },
  error: { color: '#ff6b6b', marginTop: 16, textAlign: 'center' },
});
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/login.tsx
git commit -m "feat: écran de connexion Google"
```

---

## Task 5: Provider + garde de route

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Réécrire `app/_layout.tsx`**

```tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/lib/auth';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#05070a' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}

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

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: garde de route auth obligatoire"
```

---

## Task 6: Migrer la couche données vers `requireUserId()`

**Files:**
- Modify: `lib/checkins.ts`, `lib/habits.ts`, `lib/habit-operations.ts`, `lib/categories.ts`

Principe : avec RLS actif (`auth.uid() = user_id`), le filtre `user_id` est garanti côté DB. On remplace néanmoins `SINGLE_USER_ID` par l'id réel (`requireUserId()`) pour rester explicite et cohérent avec `with check`.

- [ ] **Step 1: `lib/habit-operations.ts`**

Remplacer l'import :
```ts
import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';
```
Dans `updateHabit`, remplacer `.eq('user_id', SINGLE_USER_ID)` par :
```ts
    .eq('user_id', await requireUserId())
```
Dans `deleteHabit`, idem pour le `.eq('user_id', SINGLE_USER_ID)` sur la table `habits`.

- [ ] **Step 2: `lib/habits.ts`**

Remplacer l'import :
```ts
import { supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import { requireUserId } from './auth';
```
- `fetchHabits` : `const filterUserId = userId || (await requireUserId());`
- `fetchHabitsByCategory` : remplacer le bloc `if (userId) … else … SINGLE_USER_ID` par
  ```ts
  query = query.eq('user_id', userId ?? (await requireUserId()));
  ```
- `createHabit` : remplacer `user_id: habit.user_id || SINGLE_USER_ID,` par
  ```ts
  user_id: habit.user_id || (await requireUserId()),
  ```

- [ ] **Step 3: `lib/checkins.ts`**

Remplacer l'import de `SINGLE_USER_ID` (retirer du `import { SINGLE_USER_ID, SUPABASE_SETUP_MESSAGE, supabase }`) et ajouter :
```ts
import { requireUserId } from '@/lib/auth';
```
Dans `fetchCheckinByDate`, `fetchWeekCheckins`, `fetchDashboardData`, `saveCheckinForDate`, remplacer chaque `.eq('user_id', SINGLE_USER_ID)` et `user_id: SINGLE_USER_ID` par `await requireUserId()` :
```ts
    .eq('user_id', await requireUserId())
```
```ts
        user_id: await requireUserId(),
```

- [ ] **Step 4: `lib/categories.ts`**

> Note : la table `categories` n'existe pas dans le schéma actuel — ce module est du code mort. On le migre par cohérence mais il n'est pas couvert par RLS (pas de table). Ajouter un commentaire en tête :
```ts
// NOTE: la table `categories` n'existe pas encore dans Supabase (code non utilisé).
```
Remplacer l'import et chaque `SINGLE_USER_ID` par `await requireUserId()` comme dans les autres modules.

- [ ] **Step 5: Vérifier qu'aucun `SINGLE_USER_ID` ne subsiste hors migration**

Run: `grep -rn "SINGLE_USER_ID" lib/ app/`
Expected: plus aucune occurrence dans les modules de données (uniquement l'export dans `lib/supabase.ts`).

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (les fonctions appelantes sont déjà `async`).

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: pas de nouvelle erreur.

- [ ] **Step 8: Commit**

```bash
git add lib/checkins.ts lib/habits.ts lib/habit-operations.ts lib/categories.ts
git commit -m "refactor: utiliser l'utilisateur authentifié au lieu du placeholder"
```

---

## Task 7: Migration RLS (SQL)

**Files:**
- Create: `supabase/migrations/20260620_enable_rls.sql`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Créer `supabase/migrations/20260620_enable_rls.sql`**

```sql
-- Active RLS par utilisateur sur les tables de données et restreint les presets.

-- checkins / habits / habit_logs : user_id = auth.uid()
do $$
declare t text;
begin
  foreach t in array array['checkins', 'habits', 'habit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
    execute format('drop policy if exists open_%s_policy on public.%I', t, t);
    execute format('create policy %s_select on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy %s_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy %s_delete on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- domain_scores : pas de user_id, appartenance via checkin parent
alter table public.domain_scores enable row level security;
drop policy if exists open_domain_scores_policy on public.domain_scores;
create policy domain_scores_select on public.domain_scores for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_insert on public.domain_scores for insert to authenticated
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_update on public.domain_scores for update to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));
create policy domain_scores_delete on public.domain_scores for delete to authenticated
  using (exists (select 1 from public.checkins c where c.id = domain_scores.checkin_id and c.user_id = auth.uid()));

-- preset_habits / preset_badges : référence en lecture seule pour authenticated
alter table public.preset_habits enable row level security;
drop policy if exists open_preset_habits_policy on public.preset_habits;
create policy preset_habits_select on public.preset_habits for select to authenticated using (true);

alter table public.preset_badges enable row level security;
drop policy if exists open_preset_badges_policy on public.preset_badges;
create policy preset_badges_select on public.preset_badges for select to authenticated using (true);
```

- [ ] **Step 2: Mettre à jour `supabase/schema.sql`**

Dans `supabase/schema.sql`, pour chaque table, remplacer les blocs `disable row level security` + policies ouvertes `to anon, authenticated using (true)` par l'état RLS activé décrit ci-dessus (mêmes noms de policies). Objectif : qu'un `schema.sql` rejoué sur une base neuve produise l'état sécurisé final. (Le contenu est identique aux policies de l'étape 1 ; les reproduire dans `schema.sql` à la place des policies ouvertes correspondantes.)

- [ ] **Step 3: Appliquer la migration sur Supabase**

Run (dans le SQL editor du dashboard Supabase, ou via CLI) : coller le contenu de `20260620_enable_rls.sql` et exécuter.
Expected: `Success. No rows returned`.

- [ ] **Step 4: Vérifier l'état RLS**

Run (SQL editor) :
```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('checkins','domain_scores','habits','habit_logs','preset_habits','preset_badges');
```
Expected: `rowsecurity = true` pour les 6 tables.

- [ ] **Step 5: Vérifier l'absence de policy `anon`**

Run (SQL editor) :
```sql
select polname, tablename from pg_policies
where schemaname = 'public' and 'anon' = any (string_to_array(replace(roles::text,'{','') , ','));
```
Expected: 0 ligne (aucune policy n'autorise `anon`).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260620_enable_rls.sql supabase/schema.sql
git commit -m "feat(db): active RLS par utilisateur + presets en lecture seule"
```

---

## Task 8: Migration des données existantes

**Files:**
- Create: `supabase/migrations/20260620_migrate_single_user_data.sql`

> Pré-requis : s'être connecté **au moins une fois** via Google (pour que le compte existe dans `auth.users`).

- [ ] **Step 1: Créer `supabase/migrations/20260620_migrate_single_user_data.sql`**

```sql
-- Réassigne les données du placeholder vers le compte Google réel.
-- À exécuter APRÈS la première connexion. Idempotent.
do $$
declare target uuid;
begin
  select id into target from auth.users where email = 'vaquez.v@gmail.com';
  if target is null then
    raise exception 'Compte vaquez.v@gmail.com introuvable : connecte-toi d''abord via Google.';
  end if;

  update public.checkins   set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habits     set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habit_logs set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  -- domain_scores suit automatiquement via checkin_id (pas de colonne user_id propre).

  raise notice 'Migration terminée vers %', target;
end $$;
```

- [ ] **Step 2: (Après 1ʳᵉ connexion) Exécuter la migration**

Run (SQL editor Supabase) : coller le script et exécuter.
Expected: `NOTICE: Migration terminée vers <uuid>`, aucune erreur.

- [ ] **Step 3: Vérifier qu'il ne reste plus de données placeholder**

Run (SQL editor) :
```sql
select
  (select count(*) from public.checkins   where user_id = '00000000-0000-0000-0000-000000000000') as checkins,
  (select count(*) from public.habits     where user_id = '00000000-0000-0000-0000-000000000000') as habits,
  (select count(*) from public.habit_logs where user_id = '00000000-0000-0000-0000-000000000000') as logs;
```
Expected: `0, 0, 0`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260620_migrate_single_user_data.sql
git commit -m "feat(db): script de migration des données vers le compte réel"
```

---

## Task 9: Durcissement du repo (secrets & artefacts)

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ajouter les règles à `.gitignore`**

Ajouter à la fin de `.gitignore` :
```
# secrets & artefacts
.env
*.apk
```

- [ ] **Step 2: Détracker `.env` et l'APK (sans les supprimer du disque)**

Run:
```bash
git rm --cached .env build-1781204885683.apk
```
Expected: deux fichiers retirés de l'index.

- [ ] **Step 3: Vérifier**

Run: `git status --short && git check-ignore .env build-1781204885683.apk`
Expected: `.env` et l'APK listés comme `D` (cached) et ignorés.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore(security): ignore .env et *.apk, détrack les artefacts"
```

> Note : `.env` et l'APK restent dans l'**historique** git. Le rapport d'audit (Task 10) recommandera une purge d'historique (`git filter-repo`) et, surtout, la **rotation de la clé anon** si le repo a été partagé.

---

## Task 10: Rapport d'audit de sécurité

**Files:**
- Create: `docs/superpowers/specs/2026-06-20-security-audit-report.md`

- [ ] **Step 1: Lancer l'audit de dépendances**

Run: `npm audit --omit=dev`
Noter le nombre de vulnérabilités par sévérité (à reporter dans le rapport).

- [ ] **Step 2: Vérifier qu'aucune clé service_role n'est dans le code/bundle**

Run: `grep -rniE "service_role|service-role|sb_secret|SUPABASE_SERVICE" . --include="*.ts" --include="*.tsx" --include="*.js" --include=".env*" | grep -v node_modules`
Expected: aucune occurrence. (Reporter le résultat dans le rapport.)

- [ ] **Step 3: Rédiger `docs/superpowers/specs/2026-06-20-security-audit-report.md`**

Structure (remplir avec les résultats réels des étapes 1-2 et des Tasks 7/9) :
```markdown
# Rapport d'audit de sécurité — LifeXP (2026-06-20)

## Résumé exécutif
Tableau : sévérité × nombre de constats × statut (corrigé / recommandé).

## Critique
- (le cas échéant — sinon « aucun »)

## Élevé
- **Secrets dans l'historique git** : `.env` et `build-*.apk` ont été committés.
  Détrackés (Task 9). Reste dans l'historique → recommander `git filter-repo`
  + **rotation de la clé anon Supabase** si le repo a fui.

## Moyen
- **Tokens au repos** : désormais chiffrés via expo-secure-store sur natif
  (corrigé, Task 1-2). Web : localStorage (limite inhérente au navigateur).
- **RLS** : activé sur 6 tables, policies `auth.uid() = user_id`, aucune policy
  `anon` résiduelle (vérifié Task 7, étapes 4-5).

## Faible / Informatif
- **APK 90 Mo committé** : pollue le repo (détracké).
- **Code mort** : `lib/categories.ts` cible une table inexistante.
- **Dépendances** : résultat de `npm audit` = <à compléter>.
- **Redirect URLs** : vérifier l'allowlist stricte dans le dashboard Supabase
  (Authentication → URL Configuration) : `lifexp://auth/callback` + origine web.

## Vérifications effectuées
- `rowsecurity = true` sur les 6 tables (Task 7).
- 0 policy autorisant `anon` (Task 7).
- 0 référence à `service_role` dans le code (étape 2).
- Données placeholder migrées : 0 ligne résiduelle (Task 8).

## Recommandations de suivi
1. Rotation de la clé anon si l'historique a été exposé.
2. Purge d'historique (`git filter-repo --path .env --path build-1781204885683.apk --invert-paths`).
3. Activer « Leaked password protection » dans Supabase Auth.
4. Restreindre l'allowlist des redirect URLs.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-20-security-audit-report.md
git commit -m "docs(security): rapport d'audit de sécurité"
```

---

## Task 11: Vérification finale

- [ ] **Step 1: Suite de tests complète**

Run: `npm test`
Expected: tous les tests PASS (secure-storage + auth).

- [ ] **Step 2: TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: aucune nouvelle erreur.

- [ ] **Step 4: Test manuel du flow OAuth (Web)**

Run: `npm run web` → ouvrir l'app → cliquer « Continuer avec Google » → autoriser → vérifier la redirection vers l'app authentifiée et l'affichage des données.

- [ ] **Step 5: Test manuel du flow OAuth (Android)**

Run: build/lancer sur Android → même scénario → vérifier le retour via deep-link `lifexp://auth/callback` et la session persistée après redémarrage de l'app.

- [ ] **Step 6: Test RLS croisé**

Avec un second compte Google, vérifier (SQL ou UI) qu'il ne voit aucune donnée du premier compte.

- [ ] **Step 7: Configuration Supabase (manuel, dashboard)**

- Authentication → Providers → **Google** : activer, renseigner Client ID / Secret (créés dans Google Cloud Console, OAuth consent + credentials).
- Authentication → URL Configuration → **Redirect URLs** : ajouter `lifexp://auth/callback` et l'URL web (ex. `http://localhost:8081` en dev, domaine de prod sinon).

---

## Self-Review (rempli à l'écriture du plan)

- **Couverture spec** : OAuth (Tasks 3-5), RLS (Task 7), migration données (Task 8), audit (Tasks 9-10), stockage chiffré (Tasks 1-2). ✓
- **Placeholders** : le rapport d'audit (Task 10) contient des `<à compléter>` **volontaires**, à remplir avec les sorties réelles des commandes — ce ne sont pas des trous de plan mais des champs de résultat.
- **Cohérence des types** : `requireUserId(): Promise<string>` utilisé de façon homogène (Tasks 3, 6) ; `secureStorageAdapter` (Task 1) consommé par `lib/supabase.ts` (Task 2) ; `getRedirectUri()` partagé entre `auth.tsx` et la config Supabase.
```
