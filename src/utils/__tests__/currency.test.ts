import { formatPaise, parseRupeesToPaise } from '../currency';

describe('currency utilities', () => {
  it('correctly formats paise amounts in Indian Rupee format', () => {
    expect(formatPaise(100)).toContain('1.00');
    expect(formatPaise(25000)).toContain('250.00');
    expect(formatPaise(10000000)).toContain('1,00,000.00');
  });

  it('correctly parses rupee input strings to integer paise', () => {
    expect(parseRupeesToPaise('250')).toBe(25000);
    expect(parseRupeesToPaise('250.5')).toBe(25050);
    expect(parseRupeesToPaise('250.75')).toBe(25075);
    expect(parseRupeesToPaise('₹ 1,250.50')).toBe(125050);
    expect(parseRupeesToPaise('Rs. 500.00')).toBe(50000);
    expect(parseRupeesToPaise('invalid')).toBeNull();
  });
});
