import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore impose ~2048 octets par valeur ; on garde une marge.
export const CHUNK_SIZE = 1800;

export function chunkValue(value: string): string[] {
  if (value.length === 0) return [''];
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export function reassembleChunks(chunks: string[]): string {
  return chunks.join('');
}

function countKey(key: string): string {
  return `${key}__chunks`;
}
function chunkKey(key: string, index: number): string {
  return `${key}__${index}`;
}

async function setNative(key: string, value: string): Promise<void> {
  const previousCountRaw = await SecureStore.getItemAsync(countKey(key));
  const previousCount = previousCountRaw == null ? 0 : Number(previousCountRaw);

  const chunks = chunkValue(value);
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  await Promise.all(
    chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
  );

  // Supprime les chunks orphelins d'une valeur précédente plus longue.
  for (let i = chunks.length; i < previousCount; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
}

async function getNative(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(countKey(key));
  if (countRaw == null) return null;
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count < 0) return null;
  const chunks: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
    if (chunk == null) return null; // chunk manquant → session traitée comme absente
    chunks.push(chunk);
  }
  return reassembleChunks(chunks);
}

async function removeNative(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(countKey(key));
  if (countRaw == null) return;
  const count = Number(countRaw);
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.deleteItemAsync(countKey(key));
}

// Adaptateur conforme à l'interface storage attendue par supabase-js.
export const secureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
      );
    }
    return getNative(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return setNative(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return removeNative(key);
  },
};
