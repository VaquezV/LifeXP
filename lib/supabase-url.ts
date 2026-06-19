/**
 * Normalise l'URL Supabase fournie en variable d'environnement.
 *
 * `createClient()` attend l'URL de projet nue (`https://<ref>.supabase.co`) et
 * construit lui-même `/rest/v1`, `/auth/v1`, etc. La page « API » du dashboard
 * affiche l'URL REST avec le suffixe `/rest/v1/` : collé tel quel, il casse les
 * appels REST (chemin doublé) ET le flow OAuth (l'URL d'autorisation passe par la
 * passerelle REST qui exige un `apikey`, d'où « No API key found in request »).
 */
export function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '')
    .replace(/\/+$/, '');
}
