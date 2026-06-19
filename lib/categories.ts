// NOTE: la table `categories` n'existe pas encore dans Supabase (code non utilisé).
import { supabase } from '@/lib/supabase';
import { requireUserId } from '@/lib/auth';

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  return supabase;
}

export async function fetchCategories(): Promise<Category[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('user_id', await requireUserId());

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function createCategory(name: string, color: string): Promise<Category | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('categories')
    .insert({
      name,
      color,
      user_id: await requireUserId(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return data;
}

export async function updateCategory(
  id: string,
  name: string,
  color: string
): Promise<Category | null> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('categories')
    .update({ name, color })
    .eq('id', id)
    .eq('user_id', await requireUserId())
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    return null;
  }

  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const client = ensureSupabase();
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', await requireUserId());

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
}
