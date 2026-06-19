import 'react-native-url-polyfill/auto';

import { Platform, AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { secureStorageAdapter } from './secure-storage';

// Conservé uniquement pour le script de migration des anciennes données.
export const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000000';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_SETUP_MESSAGE =
  'Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans un fichier .env.';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: secureStorageAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

// Sur natif, démarre/arrête l'auto-refresh selon l'état de l'app.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
