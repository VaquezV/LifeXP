import { supabase, SINGLE_USER_ID } from '@/lib/supabase';
import { CategoryType } from '@/lib/types';

export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', SINGLE_USER_ID);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function createCategory(name: string, color: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      color,
      user_id: SINGLE_USER_ID,
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
  const { data, error } = await supabase
    .from('categories')
    .update({ name, color })
    .eq('id', id)
    .eq('user_id', SINGLE_USER_ID)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    return null;
  }

  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', SINGLE_USER_ID);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
}
