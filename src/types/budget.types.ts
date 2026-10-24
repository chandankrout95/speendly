import type { Paise } from '../utils/currency';

export const BudgetPeriod = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;
export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export interface Budget {
  id: string;
  name: string;
  amountMinor: Paise;
  currency: string;
  period: BudgetPeriod;
  categoryId: string | null; // null = overall budget
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInsert {
  id: string;
  name: string;
  amountMinor: Paise;
  currency: string;
  period: BudgetPeriod;
  categoryId?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
}

export interface BudgetProgress {
  budget: Budget;
  spentMinor: Paise;
  remainingMinor: Paise;
  percentage: number;
  isExceeded: boolean;
  isApproaching: boolean; // >=80%
  categoryName: string | null;
}

export interface MerchantRule {
  id: string;
  merchantPattern: string;
  normalizedMerchant: string;
  categoryId: string;
  matchType: 'exact' | 'contains' | 'startsWith';
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
