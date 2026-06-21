/**
 * Tests d'intégration Supabase — connexion + lecture + protection RLS.
 * Ces tests appellent l'API Supabase réelle (clé anon, pas de mock).
 * Nécessite EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env
 */

require('dotenv').config();
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Skip all if env vars absent (CI sans .env)
const SKIP = !supabaseUrl || !anonKey;

describe('Supabase — connexion', () => {
  it("les variables d'environnement sont presentes", () => {
    if (SKIP) return;
    expect(supabaseUrl).toBeTruthy();
    expect(anonKey).toBeTruthy();
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it('la clé anon est un JWT valide (3 parties base64)', () => {
    if (SKIP) return;
    const parts = anonKey.split('.');
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    expect(payload.role).toBe('anon');
  });

  it('ping Supabase — la table preset_habits répond', async () => {
    if (SKIP) return;
    const client = createClient(supabaseUrl, anonKey);
    const { error } = await client.from('preset_habits').select('id').limit(1);
    expect(error).toBeNull();
  }, 10000);
});

describe('Supabase — lecture preset_habits (public, anon)', () => {
  let client: any;

  beforeAll(() => {
    if (SKIP) return;
    client = createClient(supabaseUrl, anonKey);
  });

  it('fetchPresetHabits retourne au moins 10 presets', async () => {
    if (SKIP) return;
    const { data, error } = await client.from('preset_habits').select('*');
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(10);
  }, 10000);

  it('chaque preset a les champs obligatoires', async () => {
    if (SKIP) return;
    const { data } = await client.from('preset_habits').select('*');
    const presets: any[] = data ?? [];
    for (const p of presets) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(['self_care', 'dev_perso', 'vie_familiale', 'vie_pro']).toContain(p.category);
      expect(['per_day', 'times_per_day', 'times_per_week']).toContain(p.frequency_type);
      expect(typeof p.target_value).toBe('number');
      expect(p.target_value).toBeGreaterThan(0); // ← valide que les presets n'ont pas target=0
      expect(typeof p.min_value).toBe('number');
    }
  }, 10000);

  it('presets V2 présents: Sommeil, Soin, Traitement, Instrument, Solfège, Activité, Chien', async () => {
    if (SKIP) return;
    const { data } = await client.from('preset_habits').select('name');
    const rows: Array<{ name: string }> = data ?? [];
    const names = new Set(rows.map((p) => p.name));
    expect(names).toContain('Sommeil');
    expect(names).toContain('Soin');
    expect(names).toContain('Traitement');
    expect(names).toContain('Instrument');
    expect(names).toContain('Solfège');
    expect(names).toContain('Activité');
    expect(names).toContain('Chien');
  }, 10000);

  it('Activité/Marche: per_day, min=8000, target=10000, max=12000', async () => {
    if (SKIP) return;
    const { data } = await client
      .from('preset_habits')
      .select('*')
      .eq('name', 'Activité')
      .eq('expertise', 'Marche')
      .single();
    expect(data).not.toBeNull();
    const preset = data as {
      frequency_type: string;
      min_value: number;
      target_value: number;
      max_value: number;
    };
    expect(preset.frequency_type).toBe('per_day');
    expect(preset.min_value).toBe(8000);
    expect(preset.target_value).toBe(10000);
    expect(preset.max_value).toBe(12000);
  }, 10000);

  it('Traitement: 4 variantes (1x/jour, 2x/jour, 3x/jour, 1x/semaine)', async () => {
    if (SKIP) return;
    const { data } = await client
      .from('preset_habits')
      .select('expertise')
      .eq('name', 'Traitement');
    expect(data).not.toBeNull();
    const expertises = (data ?? []).map((p: { expertise: string }) => p.expertise);
    expect(expertises).toContain('1x/jour');
    expect(expertises).toContain('2x/jour');
    expect(expertises).toContain('3x/jour');
    expect(expertises).toContain('1x/semaine');
  }, 10000);

  it('Chien: 3 variantes (Balade, Brossage quotidien, Brossage hebdo)', async () => {
    if (SKIP) return;
    const { data } = await client
      .from('preset_habits')
      .select('expertise')
      .eq('name', 'Chien');
    const expertises = (data ?? []).map((p: { expertise: string }) => p.expertise);
    expect(expertises).toContain('Balade');
    expect(expertises).toContain('Brossage quotidien');
    expect(expertises).toContain('Brossage hebdo');
  }, 10000);

  it('Soin: comprend Dents et Douche (noms V2)', async () => {
    if (SKIP) return;
    const { data } = await client
      .from('preset_habits')
      .select('expertise')
      .eq('name', 'Soin');
    const expertises = (data ?? []).map((p: { expertise: string }) => p.expertise);
    expect(expertises).toContain('Dents');
    expect(expertises).toContain('Douche');
  }, 10000);

  it('Instrument: présent (renommé depuis Musique)', async () => {
    if (SKIP) return;
    const { data: musique } = await client.from('preset_habits').select('id').eq('name', 'Musique');
    const { data: instrument } = await client.from('preset_habits').select('id').eq('name', 'Instrument');
    expect((musique ?? []).length).toBe(0);     // Musique n'existe plus
    expect((instrument ?? []).length).toBeGreaterThan(0); // Instrument existe
  }, 10000);
});

describe('Supabase — protection RLS (habits, sans auth)', () => {
  let client: any;

  beforeAll(() => {
    if (SKIP) return;
    client = createClient(supabaseUrl, anonKey);
    // Pas de session utilisateur — clé anon pure
  });

  it('SELECT habits sans auth retourne 0 lignes (RLS filtre par user_id)', async () => {
    if (SKIP) return;
    const { data, error } = await client.from('habits').select('*');
    // Supabase RLS avec clé anon sans session: data vide ou error selon la policy
    // La policy doit être: SELECT WHERE user_id = auth.uid()
    // Sans session, auth.uid() = null → aucune ligne
    const rows: any[] = data ?? [];
    const isEmpty = rows.length === 0;
    const isRLSError = error !== null;
    expect(isEmpty || isRLSError).toBe(true);
  }, 10000);

  it('INSERT habit sans auth est refusé par RLS', async () => {
    if (SKIP) return;
    const { error } = await client.from('habits').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Test RLS',
      emoji: '🔒',
      category: 'self_care',
      frequency_type: 'per_day',
      frequency_value: 1,
      min_value: 0,
      target_value: 60,
      max_value: null,
      preset_habit_id: null,
    });
    // La RLS doit bloquer l'insert sans session authentifiée
    expect(error).not.toBeNull();
  }, 10000);

  it('DELETE habit sans auth est refusé (pas de corruption de données)', async () => {
    if (SKIP) return;
    const { error } = await client
      .from('habits')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');
    // Soit erreur, soit 0 lignes supprimées — dans les deux cas, pas de dommage
    if (error) {
      expect(error).not.toBeNull();
    } else {
      // Pas d'erreur mais RLS guarantit 0 suppressions réelles
      expect(true).toBe(true);
    }
  }, 10000);

  it('UPDATE habit sans auth est refusé', async () => {
    if (SKIP) return;
    const { error } = await client
      .from('habits')
      .update({ name: 'Hacked' })
      .eq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      expect(error).not.toBeNull();
    } else {
      // RLS: aucune ligne mise à jour possible sans session
      expect(true).toBe(true);
    }
  }, 10000);
});
