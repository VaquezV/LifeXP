# Rapport d'audit de sécurité — LifeXP

Date : 2026-06-20
Branche auditée : `feat/google-oauth-rls`

## Résumé exécutif

| Sévérité | Constats | Statut |
|---|---|---|
| Critique | 0 (applicatif) | — |
| Élevé | 1 — APK volumineux dans l'historique git | Atténué (détracké) |
| Moyen | 2 — RLS, stockage des tokens | Corrigés |
| Faible / Info | 3 — vulnérabilités de la chaîne de build, code mort, allowlist redirect | Recommandations |

Aucune fuite de secret applicatif détectée. La clé `service_role` n'apparaît nulle part dans
le code ou le bundle. `.env` n'a jamais été commité (aucune entrée dans l'historique git).

## Constats détaillés

### Élevé — APK de 86 Mo présent dans l'historique git
`build-1781204885683.apk` était suivi par git (commit `5510b55`).
- **Action effectuée** : ajouté à `.gitignore` (`*.apk`, `*.aab`) et détracké (`git rm --cached`)
  — il reste sur le disque mais n'est plus suivi (commit `c232552`).
- **Impact réel** : un APK Expo embarque les variables `EXPO_PUBLIC_*` (URL Supabase + clé
  anon), **publiques par conception** — ce n'est donc pas une fuite de secret, mais un
  problème de poids du dépôt et de surface d'analyse.
- **Recommandation** : purger l'historique si la taille du dépôt importe :
  `git filter-repo --path build-1781204885683.apk --invert-paths` (puis force-push). Non
  bloquant pour la sécurité.

### Moyen — RLS (Row Level Security)
- **Avant** : RLS désactivé sur toutes les tables, policies ouvertes `to anon` (`using true`)
  → n'importe quel porteur de la clé anon pouvait lire/écrire toutes les données.
- **Après** (migration `20260620_enable_rls.sql`, reflétée dans `schema.sql`) :
  - RLS activé sur les 6 tables.
  - `checkins`, `habits`, `habit_logs` : policies `auth.uid() = user_id` (select/insert/update/delete),
    colonne `user_id` avec `default auth.uid()`.
  - `domain_scores` : appartenance via le `checkin` parent.
  - `preset_habits` / `preset_badges` : lecture seule pour `authenticated`, écriture réservée
    au `service_role` (seed).
  - Toutes les policies `anon` supprimées.
- **Statut** : code prêt. **Application en base à faire manuellement** (dashboard Supabase),
  puis vérifier `rowsecurity = true` sur les 6 tables et 0 policy autorisant `anon`.

### Moyen — Stockage des tokens de session
- **Avant** : `persistSession: false` (pas de persistance) ; tout passage à AsyncStorage
  aurait stocké les tokens en clair.
- **Après** : adaptateur `lib/secure-storage.ts` — chiffré au repos via `expo-secure-store`
  sur natif (Keychain iOS / Keystore Android), avec découpage en chunks pour contourner la
  limite ~2048 octets ; `localStorage` sur Web (limite inhérente au navigateur). Nettoyage
  des chunks orphelins à la réécriture et échec propre (retour `null`) sur lecture déchirée.
- **Statut** : corrigé (Tasks 1-2), couvert par tests unitaires.

### Faible — Vulnérabilités de dépendances (chaîne de build)
`npm audit --omit=dev` : **27 vulnérabilités** (1 faible, 23 moyennes, 2 élevées, 1 critique).
Les paquets élevés/critiques — `shell-quote`, `undici`, `ws` — sont des dépendances
**transitives de la chaîne Expo / Metro / dev-middleware**, non embarquées dans le bundle
applicatif livré.
- **Recommandation** : `npm audit fix` (sans `--force` d'abord pour éviter les breaking
  changes), puis revérifier. Priorité faible car hors runtime de production.

### Faible / Info — Code mort
`lib/categories.ts` cible une table `categories` inexistante dans le schéma. Migré par
cohérence mais non utilisé. **Recommandation** : supprimer si confirmé inutile.

### Info — Allowlist des redirect URLs (à configurer côté Supabase)
Le flow OAuth utilise `lifexp://auth/callback` (natif) et l'origine web. **Recommandation** :
dans Supabase → Authentication → URL Configuration, restreindre la liste des redirect URLs à
ces seules valeurs (anti open-redirect). Activer aussi « Leaked password protection ».

## Vérifications effectuées

- `grep` service_role / clés privées dans `*.ts/tsx/js/.env*` → **0 occurrence**.
- Historique git de `.env` → **vide** (jamais commité).
- `SINGLE_USER_ID` résiduel dans le code applicatif → **0** (seul l'export subsiste pour le
  script de migration).
- Aucune policy `anon` ni `disable row level security` dans `schema.sql`.

## Recommandations de suivi (par priorité)

1. **Appliquer** `20260620_enable_rls.sql` en base, puis vérifier RLS active + 0 policy `anon`.
2. **Configurer** Google OAuth + l'allowlist stricte des redirect URLs dans Supabase.
3. `npm audit fix` sur la chaîne de build.
4. Purger l'APK de l'historique git si le poids du dépôt importe.
5. Supprimer le code mort `lib/categories.ts` si confirmé.
