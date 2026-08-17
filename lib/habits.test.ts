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

import {
  deleteHabit,
  removeHabitFromList,
  fetchHabits,
  createHabit,
  reactivateHabit,
  moveHabitUp,
} from './habits';
import { supabase } from './supabase';

const from = (supabase as any).from as jest.Mock;

afterEach(() => {
  from.mockClear();
});

/** Chainable query-builder mock: every method returns itself, awaiting it (or .single()) resolves to `result`. */
function makeQueryBuilder(result: { data?: any; error?: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
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
    is_active: true,
    position: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('fetchHabits', () => {
  it('filtre sur is_active=true et trie par position', async () => {
    const builder = makeQueryBuilder({ data: [habit('a')], error: null });
    from.mockReturnValue(builder);

    const result = await fetchHabits();

    expect(from).toHaveBeenCalledWith('habits');
    expect(builder.eq).toHaveBeenCalledWith('is_active', true);
    expect(builder.order).toHaveBeenCalledWith('position', { ascending: true });
    expect(result).toEqual([habit('a')]);
  });
});

describe('deleteHabit', () => {
  it('désactive (soft-delete) via update({is_active:false}).eq(id) au lieu d\'un DELETE', async () => {
    const builder = makeQueryBuilder({ error: null });
    from.mockReturnValue(builder);

    await expect(deleteHabit('habit-1')).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledWith('habits');
    expect(builder.update).toHaveBeenCalledWith({ is_active: false });
    expect(builder.eq).toHaveBeenCalledWith('id', 'habit-1');
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it('throws when Supabase returns an error', async () => {
    const builder = makeQueryBuilder({ error: new Error('boom') });
    from.mockReturnValue(builder);

    await expect(deleteHabit('habit-1')).rejects.toThrow('boom');
  });
});

describe('createHabit', () => {
  it('calcule position = max(position actif de la catégorie) + 1', async () => {
    const positionBuilder = makeQueryBuilder({ data: [{ position: 3 }], error: null });
    const insertBuilder = makeQueryBuilder({ data: habit('new', { position: 4 }), error: null });
    from.mockReturnValueOnce(positionBuilder).mockReturnValueOnce(insertBuilder);

    const result = await createHabit({
      user_id: 'user-1',
      category: 'self_care',
      name: 'New habit',
      emoji: '⭐',
      frequency_type: 'per_day',
      frequency_value: 1,
      min_value: 0,
      target_value: 1,
      max_value: null,
      preset_habit_id: null,
    });

    expect(positionBuilder.eq).toHaveBeenCalledWith('is_active', true);
    expect(insertBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ position: 4 }));
    expect(result.position).toBe(4);
  });

  it('démarre à 0 quand la catégorie ne contient encore aucune habitude active', async () => {
    const positionBuilder = makeQueryBuilder({ data: [], error: null });
    const insertBuilder = makeQueryBuilder({ data: habit('new', { position: 0 }), error: null });
    from.mockReturnValueOnce(positionBuilder).mockReturnValueOnce(insertBuilder);

    await createHabit({
      user_id: 'user-1',
      category: 'self_care',
      name: 'First habit',
      emoji: '⭐',
      frequency_type: 'per_day',
      frequency_value: 1,
      min_value: 0,
      target_value: 1,
      max_value: null,
      preset_habit_id: null,
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ position: 0 }));
  });
});

describe('reactivateHabit', () => {
  it('repasse is_active=true et replace en fin de catégorie', async () => {
    const fetchExistingBuilder = makeQueryBuilder({ data: { user_id: 'user-1', category: 'self_care' }, error: null });
    const positionBuilder = makeQueryBuilder({ data: [{ position: 1 }], error: null });
    const updateBuilder = makeQueryBuilder({ data: habit('h1', { is_active: true, position: 2 }), error: null });

    from
      .mockReturnValueOnce(fetchExistingBuilder)
      .mockReturnValueOnce(positionBuilder)
      .mockReturnValueOnce(updateBuilder);

    const result = await reactivateHabit('h1');

    expect(updateBuilder.update).toHaveBeenCalledWith({ is_active: true, position: 2 });
    expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'h1');
    expect(result.is_active).toBe(true);
    expect(result.position).toBe(2);
  });
});

describe('moveHabitUp', () => {
  it('échange la position avec l\'habitude précédente de la même catégorie', async () => {
    const listBuilder = makeQueryBuilder({
      data: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
      ],
      error: null,
    });
    const updateCurrentBuilder = makeQueryBuilder({ error: null });
    const updatePreviousBuilder = makeQueryBuilder({ error: null });

    from
      .mockReturnValueOnce(listBuilder)
      .mockReturnValueOnce(updateCurrentBuilder)
      .mockReturnValueOnce(updatePreviousBuilder);

    await moveHabitUp('b', 'self_care');

    expect(updateCurrentBuilder.update).toHaveBeenCalledWith({ position: 0 });
    expect(updateCurrentBuilder.eq).toHaveBeenCalledWith('id', 'b');
    expect(updatePreviousBuilder.update).toHaveBeenCalledWith({ position: 1 });
    expect(updatePreviousBuilder.eq).toHaveBeenCalledWith('id', 'a');
  });

  it('ne fait rien si l\'habitude est déjà première de la catégorie', async () => {
    const listBuilder = makeQueryBuilder({
      data: [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
      ],
      error: null,
    });
    from.mockReturnValueOnce(listBuilder);

    await moveHabitUp('a', 'self_care');

    expect(from).toHaveBeenCalledTimes(1);
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
