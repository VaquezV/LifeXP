import { chunkValue, reassembleChunks, CHUNK_SIZE } from './secure-storage';

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
