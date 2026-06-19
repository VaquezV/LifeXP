import { chunkValue, reassembleChunks, CHUNK_SIZE, secureStorageAdapter } from './secure-storage';

// ---------------------------------------------------------------------------
// Stateful in-memory mock for expo-secure-store (overrides jest.setup.js mock)
// ---------------------------------------------------------------------------
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => (store.has(k) ? store.get(k) : null)),
    setItemAsync: jest.fn(async (k: string, v: string) => { store.set(k, v); }),
    deleteItemAsync: jest.fn(async (k: string) => { store.delete(k); }),
    __store: store,
  };
});

// Force the native (non-web) code path
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

describe('secureStorageAdapter native (chunked)', () => {
  // Import the mock module to access __store
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store') as {
    getItemAsync: jest.Mock;
    setItemAsync: jest.Mock;
    deleteItemAsync: jest.Mock;
    __store: Map<string, string>;
  };

  beforeEach(() => {
    SecureStore.__store.clear();
    jest.clearAllMocks();
  });

  it('round-trips a multi-chunk value', async () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10);
    await secureStorageAdapter.setItem('k', value);
    const result = await secureStorageAdapter.getItem('k');
    expect(result).toBe(value);
  });

  it('overwrite shrinking deletes orphan chunks', async () => {
    const longValue = 'x'.repeat(CHUNK_SIZE * 2 + 10); // 3 chunks
    await secureStorageAdapter.setItem('k', longValue);

    const shortValue = 'hello'; // 1 chunk
    await secureStorageAdapter.setItem('k', shortValue);

    expect(await secureStorageAdapter.getItem('k')).toBe(shortValue);
    expect(SecureStore.__store.has('k__1')).toBe(false);
    expect(SecureStore.__store.has('k__2')).toBe(false);
  });

  it('missing chunk returns null instead of corrupted value', async () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10); // 3 chunks
    await secureStorageAdapter.setItem('k', value);
    // Manually delete the middle chunk
    SecureStore.__store.delete('k__1');

    const result = await secureStorageAdapter.getItem('k');
    expect(result).toBeNull();
  });

  it('non-integer count returns null', async () => {
    SecureStore.__store.set('k__chunks', 'abc');
    const result = await secureStorageAdapter.getItem('k');
    expect(result).toBeNull();
  });
});

describe('chunkValue / reassembleChunks', () => {
  it('découpe une valeur plus grande que CHUNK_SIZE et la reconstitue', () => {
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10);
    const chunks = chunkValue(value);
    expect(chunks.length).toBe(3);
    expect(reassembleChunks(chunks)).toBe(value);
  });

  it('gère une petite valeur en un seul chunk', () => {
    const value = 'hello';
    const chunks = chunkValue(value);
    expect(chunks.length).toBe(1);
    expect(reassembleChunks(chunks)).toBe(value);
  });

  it('reconstitue une liste vide en chaîne vide', () => {
    expect(reassembleChunks([])).toBe('');
  });
});
