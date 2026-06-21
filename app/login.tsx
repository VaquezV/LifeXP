import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
      <Text style={styles.subtitle}>Un pas chaque jour</Text>
      <Text style={styles.subtitle}> L'élan vient du reste </Text>
      <Text style={styles.hint}> L'application pour mettre en place tes bonnes habitudes </Text>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#061121', padding: 24 },
  title: { color: '#e1e9fc', fontSize: 72, fontWeight: '700', marginBottom: 32 },
  subtitle: { color: '#9aa4b2', fontSize: 36, marginBottom: 10, textAlign: 'center' },


  hint: { color: '#9aa4b2', fontSize: 18, marginBottom: 18, marginTop: 18, textAlign: 'center' },
  button: { backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 28, borderRadius: 12, minWidth: 240, marginTop: 18, alignItems: 'center' },
  buttonText: { color: '#05070a', fontSize: 16, fontWeight: '600' },
  error: { color: '#ff6b6b', marginTop: 16, textAlign: 'center' },
});
