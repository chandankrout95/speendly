/**
 * Demo data seeder — clearly identified sample transactions for testing.
 * All transactions are marked with source='demo' so they never mix with real data.
 */

import { insertTransaction } from '../../database/repositories/transactionRepository';
import { setSetting, getSetting, SettingKeys } from '../../database/repositories/settingsRepository';
import type { TransactionInsert } from '../../types/transaction.types';
import { TransactionType, CategorizationStatus, TransactionSource } from '../../types/transaction.types';

const DEMO_TRANSACTIONS: Omit<TransactionInsert, 'id' | 'receivedAt' | 'fingerprint'>[] = [
  { amountMinor: 25000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Swiggy', transactionDate: daysAgo(0), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 45075, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'groceries', merchantName: 'BigBasket', transactionDate: daysAgo(0), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.9 },
  { amountMinor: 15000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'travel', merchantName: 'Uber', transactionDate: daysAgo(1), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.92 },
  { amountMinor: 199900, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'shopping', merchantName: 'Amazon', transactionDate: daysAgo(1), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.88 },
  { amountMinor: 89900, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'bills', merchantName: 'Jio Recharge', transactionDate: daysAgo(2), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 35000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Zomato', transactionDate: daysAgo(2), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.93 },
  { amountMinor: 49900, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'entertainment', merchantName: 'Netflix', transactionDate: daysAgo(3), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.95 },
  { amountMinor: 12500, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Chai Point', transactionDate: daysAgo(3), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.85 },
  { amountMinor: 150000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'health', merchantName: 'Apollo Pharmacy', transactionDate: daysAgo(4), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.9 },
  { amountMinor: 75000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'shopping', merchantName: 'Flipkart', transactionDate: daysAgo(5), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.9 },
  { amountMinor: 22000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'travel', merchantName: 'Ola', transactionDate: daysAgo(5), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.88 },
  { amountMinor: 30000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Dominos', transactionDate: daysAgo(6), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.9 },
  { amountMinor: 250000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'bills', merchantName: 'Electricity Board', transactionDate: daysAgo(7), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 49900, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'subscriptions', merchantName: 'Spotify', transactionDate: daysAgo(8), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.95 },
  { amountMinor: 65000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'personal', merchantName: 'Urban Company', transactionDate: daysAgo(9), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.85 },
  { amountMinor: 120000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'groceries', merchantName: 'DMart', transactionDate: daysAgo(10), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.9 },
  { amountMinor: 18000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Starbucks', transactionDate: daysAgo(12), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.92 },
  { amountMinor: 350000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'education', merchantName: 'Udemy', transactionDate: daysAgo(14), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.88 },
  { amountMinor: 500000, currency: 'INR', transactionType: TransactionType.TRANSFER, categoryId: 'transfers', merchantName: 'Self Transfer', transactionDate: daysAgo(15), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 28000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'McDonald\'s', transactionDate: daysAgo(16), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.9 },
  // Pending categorization items
  { amountMinor: 15500, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: null, merchantName: 'Unknown Merchant', transactionDate: daysAgo(0), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.PENDING, confidence: 0.6 },
  { amountMinor: 32000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: null, merchantName: null, transactionDate: daysAgo(1), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.PENDING, confidence: 0.5 },
  // Previous month data for comparison
  { amountMinor: 45000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'food', merchantName: 'Swiggy', transactionDate: daysAgo(32), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 200000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'shopping', merchantName: 'Myntra', transactionDate: daysAgo(35), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.9 },
  { amountMinor: 150000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'bills', merchantName: 'Airtel', transactionDate: daysAgo(38), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 85000, currency: 'INR', transactionType: TransactionType.EXPENSE, categoryId: 'groceries', merchantName: 'Nature\'s Basket', transactionDate: daysAgo(40), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.88 },
  { amountMinor: 125000, currency: 'INR', transactionType: TransactionType.INCOME, categoryId: null, merchantName: 'Client Payment', transactionDate: daysAgo(5), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.MANUAL, confidence: 0.95 },
  { amountMinor: 25000, currency: 'INR', transactionType: TransactionType.REFUND, categoryId: 'shopping', merchantName: 'Amazon Refund', transactionDate: daysAgo(3), source: TransactionSource.DEMO, categorizationStatus: CategorizationStatus.AUTO, confidence: 0.92 },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
  return d.toISOString();
}

function generateDemoId(index: number): string {
  return `demo_${index.toString().padStart(4, '0')}`;
}

export async function seedDemoData(): Promise<number> {
  const alreadySeeded = await getSetting(SettingKeys.DEMO_DATA_SEEDED);
  if (alreadySeeded === 'true') return 0;

  let count = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < DEMO_TRANSACTIONS.length; i++) {
    const demo = DEMO_TRANSACTIONS[i];
    const id = generateDemoId(i);
    try {
      await insertTransaction({
        ...demo,
        id,
        receivedAt: now,
        fingerprint: `demo_fp_${id}`,
      });
      count++;
    } catch {
      // Duplicate — ignore
    }
  }

  await setSetting(SettingKeys.DEMO_DATA_SEEDED, 'true');
  return count;
}

export async function clearDemoData(): Promise<void> {
  const { getDatabase } = await import('../../database/database');
  const db = await getDatabase();
  await db.runAsync("DELETE FROM transactions WHERE source = 'demo'");
  await setSetting(SettingKeys.DEMO_DATA_SEEDED, 'false');
}
