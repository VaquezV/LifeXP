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
