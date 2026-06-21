import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();

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
    <View style={[styles.container, { backgroundColor: colors.loginBackground }]}>
      <Text style={[styles.title, { color: colors.loginText }]}>LifeXP</Text>
      <Text style={[styles.subtitle, { color: colors.loginHint }]}>Un pas chaque jour</Text>
      <Text style={[styles.subtitle, { color: colors.loginHint }]}> L'élan vient du reste </Text>
      <Text style={[styles.hint, { color: colors.loginHint }]}> L'application pour mettre en place tes bonnes habitudes </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.loginButtonBackground }]} onPress={handlePress} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.loginBackground} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.loginBackground }]}>Continuer avec Google</Text>
        )}
      </Pressable>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 72, fontWeight: '700', marginBottom: 32 },
  subtitle: { fontSize: 36, marginBottom: 20, textAlign: 'center' },


  hint: { fontSize: 18, marginBottom: 18, marginTop: 100, textAlign: 'center' },
  button: { paddingVertical: 18, paddingHorizontal: 28, borderRadius: 12, minWidth: 240, marginTop: 20, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  error: { marginTop: 16, textAlign: 'center' },
});
