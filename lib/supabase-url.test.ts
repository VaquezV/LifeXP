import { normalizeSupabaseUrl } from './supabase-url';

describe('normalizeSupabaseUrl', () => {
  it('laisse une URL de projet nue inchangée', () => {
    expect(normalizeSupabaseUrl('https://abc.supabase.co')).toBe('https://abc.supabase.co');
  });

  it('retire le slash final', () => {
    expect(normalizeSupabaseUrl('https://abc.supabase.co/')).toBe('https://abc.supabase.co');
  });

  it("retire le suffixe /rest/v1/ collé par erreur (piège du dashboard)", () => {
    expect(normalizeSupabaseUrl('https://abc.supabase.co/rest/v1/')).toBe('https://abc.supabase.co');
    expect(normalizeSupabaseUrl('https://abc.supabase.co/rest/v1')).toBe('https://abc.supabase.co');
  });

  it('retire les espaces parasites', () => {
    expect(normalizeSupabaseUrl('  https://abc.supabase.co/rest/v1/  ')).toBe('https://abc.supabase.co');
  });
});
