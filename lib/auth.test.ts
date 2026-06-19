import { requireUserId } from './auth';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from './supabase';

const getSession = (supabase as any).auth.getSession as jest.Mock;

describe('requireUserId', () => {
  it("retourne l'id utilisateur quand une session existe", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } });
    await expect(requireUserId()).resolves.toBe('user-123');
  });

  it('lève une erreur quand aucune session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(requireUserId()).rejects.toThrow('Utilisateur non authentifié');
  });
});
