import { ACCESSORY_GAINED_QUOTES, ACCESSORY_LOST_QUOTES, pickAccessoryQuote } from './accessory-quotes';

describe('ACCESSORY_GAINED_QUOTES / ACCESSORY_LOST_QUOTES', () => {
  it('contain at least 50 quotes each', () => {
    expect(ACCESSORY_GAINED_QUOTES.length).toBeGreaterThanOrEqual(50);
    expect(ACCESSORY_LOST_QUOTES.length).toBeGreaterThanOrEqual(50);
  });

  it('have no duplicate quotes within each pool', () => {
    expect(new Set(ACCESSORY_GAINED_QUOTES).size).toBe(ACCESSORY_GAINED_QUOTES.length);
    expect(new Set(ACCESSORY_LOST_QUOTES).size).toBe(ACCESSORY_LOST_QUOTES.length);
  });

  it('contain only non-empty strings', () => {
    for (const quote of [...ACCESSORY_GAINED_QUOTES, ...ACCESSORY_LOST_QUOTES]) {
      expect(typeof quote).toBe('string');
      expect(quote.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('pickAccessoryQuote', () => {
  const quotes = ['a', 'b', 'c'] as const;

  it('picks the first quote when random returns 0', () => {
    expect(pickAccessoryQuote(quotes, () => 0)).toBe('a');
  });

  it('picks the last quote when random returns just under 1', () => {
    expect(pickAccessoryQuote(quotes, () => 0.999)).toBe('c');
  });

  it('picks the middle quote for a mid-range random value', () => {
    expect(pickAccessoryQuote(quotes, () => 0.5)).toBe('b');
  });

  it('defaults to Math.random when no generator is given', () => {
    expect(quotes).toContain(pickAccessoryQuote(quotes));
  });
});
