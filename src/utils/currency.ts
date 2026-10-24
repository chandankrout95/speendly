/** Amounts are always integer paise. Never pass floats into financial math. */
export type Paise = number;

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPaise(amountMinor: Paise): string {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError('amountMinor must be a safe integer (paise)');
  }
  return inr.format(amountMinor / 100);
}

/** "250.75" or "1,250.75" -> 25075. Returns null for anything unparseable. */
export function parseRupeesToPaise(input: string): Paise | null {
  const cleaned = input.replace(/[₹,\s]/g, '').replace(/^Rs\.?/i, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const rupees = Number(match[1]);
  const fraction = Number((match[2] ?? '0').padEnd(2, '0'));
  const total = rupees * 100 + fraction;
  return Number.isSafeInteger(total) ? total : null;
}
