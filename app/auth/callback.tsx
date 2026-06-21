import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/hooks/use-app-theme';

/**
 * Cible de redirection du flow OAuth.
 * - Web : la page recharge ici avec les tokens (ou une erreur) dans l'URL ;
 *   supabase-js (`detectSessionInUrl`) établit la session, puis on rentre.
 * - Erreur provider : on renvoie vers l'écran de connexion.
 */
export default function AuthCallback() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      /[#?&]error=/.test(window.location.href)
    ) {
      setError(true);
      const timer = setTimeout(() => router.replace('/login'), 2500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  useEffect(() => {
    if (!loading && session) router.replace('/');
  }, [session, loading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.loginBackground }]}>
      {error ? (
        <Text style={[styles.text, { color: colors.loginHint }]}>Connexion échouée. Retour à l&apos;accueil…</Text>
      ) : (
        <>
          <ActivityIndicator color={colors.text} />
          <Text style={[styles.text, { color: colors.loginHint }]}>Connexion en cours…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 16 },
});
