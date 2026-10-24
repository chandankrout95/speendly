/**
 * Transaction fingerprint service.
 * Creates a deterministic hash to detect duplicates.
 */

export function generateFingerprint(parts: {
  amountMinor: number;
  direction: string;
  merchant: string | null;
  reference: string | null;
  accountAlias: string | null;
  transactionDate: string;
}): string {
  // Prefer reference-based fingerprint for uniqueness
  if (parts.reference) {
    return hash(`ref:${parts.reference}:${parts.amountMinor}`);
  }

  // Fallback: composite fingerprint
  const components = [
    parts.amountMinor.toString(),
    parts.direction,
    parts.merchant ?? 'unknown',
    parts.accountAlias ?? 'default',
    // Truncate date to minute precision to handle slight timestamp variations
    parts.transactionDate.slice(0, 16),
  ].join('|');

  return hash(components);
}

/**
 * Simple deterministic hash (djb2). Not cryptographic, but sufficient
 * for local deduplication within a single device's SQLite database.
 */
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0xffffffff;
  }
  return `fp_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Generate a hash of the original message for dedup of identical SMS re-delivery.
 */
export function hashMessage(body: string): string {
  return hash(body.trim().toLowerCase());
}
