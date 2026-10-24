import type { Paise } from '../utils/currency';

// ─── Enumerations ──────────────────────────────────────────────────────────────

export const TransactionType = {
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer',
  REFUND: 'refund',
  REVERSAL: 'reversal',
  UNKNOWN: 'unknown',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const CategorizationStatus = {
  PENDING: 'pending',
  AUTO: 'auto',
  MANUAL: 'manual',
  EXCLUDED: 'excluded',
} as const;
export type CategorizationStatus = (typeof CategorizationStatus)[keyof typeof CategorizationStatus];

export const TransactionSource = {
  SMS: 'sms',
  MANUAL: 'manual',
  DEMO: 'demo',
} as const;
export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource];

// ─── Models ────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  amountMinor: Paise;
  currency: string;
  transactionType: TransactionType;
  categoryId: string | null;
  merchantName: string | null;
  transactionReference: string | null;
  transactionDate: string; // ISO 8601
  receivedAt: string; // ISO 8601
  source: TransactionSource;
  categorizationStatus: CategorizationStatus;
  confidence: number | null;
  fingerprint: string;
  originalMessageHash: string | null;
  accountAlias: string | null;
  isExcluded: boolean;
  relatedTransactionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInsert {
  id: string;
  amountMinor: Paise;
  currency: string;
  transactionType: TransactionType;
  categoryId?: string | null;
  merchantName?: string | null;
  transactionReference?: string | null;
  transactionDate: string;
  receivedAt: string;
  source: TransactionSource;
  categorizationStatus: CategorizationStatus;
  confidence?: number | null;
  fingerprint: string;
  originalMessageHash?: string | null;
  accountAlias?: string | null;
  isExcluded?: boolean;
  relatedTransactionId?: string | null;
  notes?: string | null;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
  transactionTypes?: TransactionType[];
  categorizationStatuses?: CategorizationStatus[];
  searchQuery?: string;
  isExcluded?: boolean;
  limit?: number;
  offset?: number;
}

export interface TransactionSummary {
  totalExpense: Paise;
  totalIncome: Paise;
  transactionCount: number;
  categorizedCount: number;
  pendingCount: number;
}

export interface DailySpending {
  date: string;
  totalMinor: Paise;
  count: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalMinor: Paise;
  count: number;
  percentage: number;
}
