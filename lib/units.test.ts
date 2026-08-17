jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  SUPABASE_SETUP_MESSAGE: 'Supabase not configured',
}));
jest.mock('./auth', () => ({
  requireUserId: jest.fn().mockResolvedValue('user-1'),
}));

import { DEFAULT_UNITS, fetchUserUnits, upsertUserUnit } from './units';
import { supabase } from './supabase';

const from = (supabase as any).from as jest.Mock;

afterEach(() => {
  from.mockClear();
});

describe('DEFAULT_UNITS', () => {
  it('contient la liste prédéfinie attendue', () => {
    expect(DEFAULT_UNITS).toEqual(['pas', 'kcal', 'km', "verres d'eau", 'pages', 'min', '€']);
  });
});

describe('fetchUserUnits', () => {
  it('récupère les labels de user_units pour l\'utilisateur courant', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ label: 'brasses' }, { label: 'pintes' }], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    from.mockReturnValue({ select });

    await expect(fetchUserUnits()).resolves.toEqual(['brasses', 'pintes']);
    expect(from).toHaveBeenCalledWith('user_units');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('lève une erreur si Supabase échoue', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
    from.mockReturnValue({ select: jest.fn(() => ({ eq: jest.fn(() => ({ order })) })) });

    await expect(fetchUserUnits()).rejects.toThrow('boom');
  });
});

describe('upsertUserUnit', () => {
  it('ignore les unités déjà dans DEFAULT_UNITS (pas d\'appel réseau)', async () => {
    await upsertUserUnit('kcal');
    expect(from).not.toHaveBeenCalled();
  });

  it('ignore un label vide', async () => {
    await upsertUserUnit('   ');
    expect(from).not.toHaveBeenCalled();
  });

  it('insère une unité custom via upsert (ignoreDuplicates)', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    await upsertUserUnit('brasses');

    expect(from).toHaveBeenCalledWith('user_units');
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', label: 'brasses' },
      { onConflict: 'user_id,label', ignoreDuplicates: true }
    );
  });
});
