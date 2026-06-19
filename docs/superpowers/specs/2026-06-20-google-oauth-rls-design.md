# Design — Authentification Google OAuth, RLS Supabase, migration de données & audit sécurité

Date : 2026-06-20
Statut : approuvé (design), en attente de relecture du spec

## 1. Contexte

LifeXP est une app Expo (Web + Android) de suivi d'habitudes, adossée à Supabase.
État actuel :

- **Mono-utilisateur** : toutes les requêtes sont filtrées sur une constante
  `SINGLE_USER_ID = '00000000-0000-0000-0000-000000000000'` ([lib/supabase.ts](../../../lib/supabase.ts)).
- **Aucune authentification** : le client est créé avec
  `persistSession: false`, `autoRefreshToken: false`.
- **RLS désactivé** : toutes les tables ont `disable row level security` et des
  policies ouvertes pour `anon` + `authenticated` (`using (true)`).
- `expo-web-browser` est déjà installé. `@react-native-async-storage/async-storage`
  et `expo-auth-session` ne le sont pas.
- L'app cible **Web et Android** (un APK est produit via EAS).

Tables de données utilisateur : `checkins`, `domain_scores` (enfant de `checkins`),
`habits`, `habit_logs`. Tables de référence globales : `preset_habits`, `preset_badges`.

## 2. Objectifs

1. Connexion **Google OAuth** obligatoire (Web + Android).
2. **RLS** activé : chaque utilisateur ne voit que ses propres données (modèle
   multi-utilisateurs générique).
3. **Migration** des données existantes (rattachées au placeholder) vers le compte
   Google réel de l'utilisateur après sa première connexion.
4. **Audit de sécurité** complet avec rapport hiérarchisé et correctifs.

Non-objectifs : autres providers OAuth (email/password, Apple…), partage de données
entre utilisateurs, fonctionnement hors-ligne.

## 3. Approche retenue

**Flow navigateur PKCE** (Option A) :
`supabase.auth.signInWithOAuth({ provider: 'google' })` ouvert via
`expo-web-browser` (`openAuthSessionAsync`), échange de code en **PKCE**.

- Un **seul chemin de code** pour Web et Android.
- **Reste en Expo managed** : aucun module natif additionnel, compatible avec le
  build EAS existant.
- Identifiants Google configurés **uniquement dans le dashboard Supabase**.

Alternatives écartées :
- **Google Sign-In natif** (`@react-native-google-signin`) : meilleure UX Android
  mais impose un config plugin + dev build, un Web Client ID + SHA-1, et un second
  chemin de code Web. Gain marginal ici.
- **Redirect implicite hébergé** : pas de PKCE (tokens dans l'URL) — rejeté.

## 4. Architecture

### 4.1 Client Supabase — [lib/supabase.ts](../../../lib/supabase.ts)

Reconfiguration du client :

- `storage` : `@react-native-async-storage/async-storage` (à installer).
- `persistSession: true`, `autoRefreshToken: true`, `flowType: 'pkce'`.
- `detectSessionInUrl` : `true` sur Web, `false` sur natif.
- Auto-refresh piloté par `AppState` (start/stop selon premier/arrière-plan).
- `SINGLE_USER_ID` n'est plus utilisé comme valeur par défaut de filtrage ; il est
  conservé temporairement comme constante référencée par le script de migration,
  puis supprimé une fois la migration faite.

### 4.2 Couche Auth (nouveau)

- `lib/auth.tsx` :
  - `AuthProvider` qui charge la session initiale et s'abonne à
    `supabase.auth.onAuthStateChange`.
  - hook `useAuth()` exposant `{ session, user, loading, signInWithGoogle, signOut }`.
  - `signInWithGoogle()` : `signInWithOAuth` + `openAuthSessionAsync` + échange de
    code (`exchangeCodeForSession`) ; `redirectTo` calculé via
    `makeRedirectUri` (scheme `lifexp://` natif, origin sur Web).
- `app/login.tsx` : écran « Continuer avec Google », état de chargement et d'erreur.
- Garde de route dans [app/_layout.tsx](../../../app/_layout.tsx) :
  - tant que `loading` → splash ;
  - pas de `session` → redirection vers `/login` ;
  - `session` présente → accès aux `(tabs)`.

### 4.3 Couche données — [lib/](../../../lib/)

- Nouveau helper `requireUserId()` (dans `lib/auth.tsx` ou `lib/supabase.ts`) qui
  retourne `session.user.id` ou lève une erreur explicite si non authentifié.
- Remplacement de **tous** les `SINGLE_USER_ID` par `requireUserId()` dans :
  `checkins.ts`, `categories.ts`, `habits.ts`, `habit-operations.ts`.
- Les `insert` ne fixent **plus** `user_id` côté client : il est imposé par la
  colonne `default auth.uid()` + la policy `with check` (défense en profondeur).

### 4.4 RLS — nouvelle migration SQL `supabase/migrations/<ts>_enable_rls.sql`

Pour `checkins`, `habits`, `habit_logs` :

```sql
alter table public.<t> enable row level security;
alter table public.<t> alter column user_id set default auth.uid();
drop policy if exists open_<t>_policy on public.<t>;
create policy <t>_select on public.<t> for select to authenticated using (auth.uid() = user_id);
create policy <t>_insert on public.<t> for insert to authenticated with check (auth.uid() = user_id);
create policy <t>_update on public.<t> for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy <t>_delete on public.<t> for delete to authenticated using (auth.uid() = user_id);
```

Pour `domain_scores` (pas de colonne `user_id`, enfant de `checkins`) : policies
basées sur l'appartenance du `checkin_id` parent :

```sql
using (exists (select 1 from public.checkins c
               where c.id = domain_scores.checkin_id and c.user_id = auth.uid()))
```

Pour `preset_habits` / `preset_badges` (référence) :

- RLS activé, `select` autorisé à `authenticated`, **aucune** policy d'écriture
  pour les rôles applicatifs (le seed passe par `service_role` qui bypass RLS).

Toutes les policies `to anon` sont supprimées. Mise à jour cohérente de
[supabase/schema.sql](../../../supabase/schema.sql) pour que le schéma de référence
reflète l'état RLS activé.

### 4.5 Migration des données — script SQL one-shot

`supabase/migrations/<ts>_migrate_single_user_data.sql` (exécuté **après** la 1ʳᵉ
connexion, dans une transaction) :

```sql
do $$
declare target uuid;
begin
  select id into target from auth.users where email = 'vaquez.v@gmail.com';
  if target is null then raise exception 'compte non trouvé, connecte-toi d''abord'; end if;

  update public.checkins   set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habits     set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  update public.habit_logs set user_id = target where user_id = '00000000-0000-0000-0000-000000000000';
  -- domain_scores suit automatiquement via checkin_id (pas de user_id propre)
end $$;
```

Idempotent (re-run sans effet si plus aucune ligne au placeholder).

## 5. Audit de sécurité (livrable séparé)

`docs/superpowers/specs/2026-06-20-security-audit-report.md`, hiérarchisé
Critique / Élevé / Moyen / Faible :

1. **Secrets & repo** : `.env` non couvert par `.gitignore` ; **APK de 90 Mo committé**
   (bloat + risque de fuite de secrets embarqués) ; durcissement `.gitignore` ;
   recommandation de purge d'historique si secrets sensibles.
2. **RLS** : vérifier que toutes les tables sont couvertes, aucune policy `anon`
   résiduelle, test croisé (un user ne lit pas les données d'un autre).
3. **Stockage des tokens** : AsyncStorage n'est pas chiffré → évaluer
   `expo-secure-store` pour la persistance de session (décision à confirmer).
4. **Config Supabase** : allowlist stricte des redirect URLs (anti open-redirect),
   expiry JWT, détection des mots de passe leakés, vérif que le `service_role` n'est
   jamais exposé côté client.
5. **Bundle client** : confirmer que seules des variables `EXPO_PUBLIC_*` (publiques
   par nature : URL + anon key) sont embarquées, aucune clé privée.
6. **Dépendances** : `npm audit`, relevé des vulnérabilités connues.

## 6. Stratégie de test

- Tests unitaires : `requireUserId()` (authentifié / non authentifié), helper de
  redirect URI.
- Vérification manuelle du flow OAuth : login + logout sur **Web** et **Android**.
- Validation RLS : avec deux comptes, confirmer qu'un utilisateur ne peut lire ni
  modifier les données de l'autre (requêtes directes).
- Vérification de la migration : compter les lignes avant/après réassignées au bon
  UID.

## 7. Risques & points ouverts

- **expo-secure-store vs AsyncStorage** pour les tokens : à trancher (sécurité vs
  simplicité). Défaut proposé : AsyncStorage, avec note d'audit.
- **Ordre d'exécution** : la migration de données doit tourner après la 1ʳᵉ
  connexion réussie (l'UID n'existe pas avant). Documenté dans le plan.
- **Build natif** : le flow PKCE navigateur nécessite que le scheme `lifexp` soit
  bien enregistré (déjà présent dans `app.json`) et la redirect URL ajoutée dans
  Supabase.
