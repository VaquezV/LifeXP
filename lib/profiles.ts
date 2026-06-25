import { requireUserId } from './auth';
import { supabase } from './supabase';

export async function fetchWolfName(): Promise<string> {
  if (!supabase) return 'Loup Sans Nom';
  const userId = await requireUserId();
  const { data } = await supabase
    .from('profiles')
    .select('wolf_name')
    .eq('user_id', userId)
    .single();
  return data?.wolf_name ?? 'Loup Sans Nom';
}

export async function saveWolfName(name: string): Promise<void> {
  if (!supabase) return;
  const userId = await requireUserId();
  await supabase
    .from('profiles')
    .upsert({ user_id: userId, wolf_name: name.trim(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}
