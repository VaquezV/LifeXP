import type { Habit } from './types';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  SUPABASE_SETUP_MESSAGE: 'Supabase not configured',
}));
jest.mock('./auth', () => ({
  requireUserId: jest.fn().mockResolvedValue('user-1'),
}));

import { deleteHabit, removeHabitFromList } from './habits';
import { supabase } from './supabase';

const from = (supabase as any).from as jest.Mock;

function habit(id: string): Habit {
  return {
    id,
    user_id: 'user-1',
    category: 'self_care',
    name: `Habit ${id}`,
    emoji: '🧘',
    frequency_type: 'per_day',
    frequency_value: 1,
    min_value: 0,
    target_value: 1,
    max_value: null,
    preset_habit_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('deleteHabit', () => {
  it('calls delete().eq(id) on the habits table and resolves on success', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn(() => ({ eq }));
    from.mockReturnValue({ delete: del });

    await expect(deleteHabit('habit-1')).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledWith('habits');
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'habit-1');
  });

  it('throws when Supabase returns an error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: new Error('boom') });
    from.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    await expect(deleteHabit('habit-1')).rejects.toThrow('boom');
  });
});

describe('removeHabitFromList', () => {
  it('removes the habit with the matching id', () => {
    const list = [habit('a'), habit('b'), habit('c')];
    expect(removeHabitFromList(list, 'b').map(h => h.id)).toEqual(['a', 'c']);
  });

  it('returns the same list unchanged when the id is not present', () => {
    const list = [habit('a'), habit('b')];
    expect(removeHabitFromList(list, 'z').map(h => h.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when deleting the only habit', () => {
    expect(removeHabitFromList([habit('a')], 'a')).toEqual([]);
  });
});
