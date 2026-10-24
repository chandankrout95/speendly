import { getDatabase } from '../database';
import type { MerchantRule } from '../../types/budget.types';

export async function getAllMerchantRules(): Promise<MerchantRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM merchant_rules WHERE isEnabled = 1 ORDER BY merchantPattern ASC',
  );
  return rows.map(mapRow);
}

export async function insertMerchantRule(
  rule: Omit<MerchantRule, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO merchant_rules (id, merchantPattern, normalizedMerchant, categoryId, matchType, isEnabled, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    rule.id,
    rule.merchantPattern,
    rule.normalizedMerchant,
    rule.categoryId,
    rule.matchType,
    rule.isEnabled ? 1 : 0,
    now,
    now,
  );
}

export async function deleteMerchantRule(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM merchant_rules WHERE id = ?', id);
}

export async function toggleMerchantRule(id: string, isEnabled: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE merchant_rules SET isEnabled = ?, updatedAt = ? WHERE id = ?',
    isEnabled ? 1 : 0,
    now,
    id,
  );
}

/** Match a merchant name against all enabled rules. Returns the categoryId if matched. */
export async function matchMerchant(merchantName: string): Promise<string | null> {
  const rules = await getAllMerchantRules();
  const lower = merchantName.toLowerCase();

  for (const rule of rules) {
    const pattern = rule.merchantPattern.toLowerCase();
    let matched = false;

    switch (rule.matchType) {
      case 'exact':
        matched = lower === pattern;
        break;
      case 'contains':
        matched = lower.includes(pattern);
        break;
      case 'startsWith':
        matched = lower.startsWith(pattern);
        break;
    }

    if (matched) return rule.categoryId;
  }

  return null;
}

function mapRow(row: Record<string, unknown>): MerchantRule {
  return {
    id: row.id as string,
    merchantPattern: row.merchantPattern as string,
    normalizedMerchant: row.normalizedMerchant as string,
    categoryId: row.categoryId as string,
    matchType: row.matchType as MerchantRule['matchType'],
    isEnabled: row.isEnabled === 1,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}
