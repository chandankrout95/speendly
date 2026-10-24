import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../../store/hooks';
import {
  getTransactionSummary,
  getDailySpending,
  getCategorySpending,
  getRecentTransactions,
  getPendingTransactions,
} from '../../../database/repositories/transactionRepository';
import { getBudgetProgress } from '../../../database/repositories/budgetRepository';
import {
  getMonthStart,
  getMonthEnd,
  getPreviousMonthStart,
  getPreviousMonthEnd,
  getWeekStart,
  getWeekEnd,
  getTodayStart,
  getTodayEnd,
  getDaysAgoStart,
} from '../../../utils/dates';
import type {
  TransactionSummary,
  DailySpending,
  CategorySpending,
  Transaction,
} from '../../../types/transaction.types';
import type { BudgetProgress } from '../../../types/budget.types';
import type { Paise } from '../../../utils/currency';

export interface DashboardData {
  // Current month
  monthSummary: TransactionSummary;
  prevMonthSummary: TransactionSummary;
  monthChange: number; // percentage
  // Today & week
  todaySpending: Paise;
  weekSpending: Paise;
  avgDailySpending: Paise;
  // Charts
  dailySpending: DailySpending[];
  categorySpending: CategorySpending[];
  // Transactions
  recentTransactions: Transaction[];
  pendingTransactions: Transaction[];
  // Budgets
  budgetProgress: BudgetProgress[];
  // Meta
  isLoading: boolean;
  error: string | null;
}

export function useDashboard(chartDays: number = 30): DashboardData {
  const dataVersion = useAppSelector((s) => s.app.dataVersion);

  const [data, setData] = useState<DashboardData>({
    monthSummary: { totalExpense: 0 as Paise, totalIncome: 0 as Paise, transactionCount: 0, categorizedCount: 0, pendingCount: 0 },
    prevMonthSummary: { totalExpense: 0 as Paise, totalIncome: 0 as Paise, transactionCount: 0, categorizedCount: 0, pendingCount: 0 },
    monthChange: 0,
    todaySpending: 0 as Paise,
    weekSpending: 0 as Paise,
    avgDailySpending: 0 as Paise,
    dailySpending: [],
    categorySpending: [],
    recentTransactions: [],
    pendingTransactions: [],
    budgetProgress: [],
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);
      const prevStart = getPreviousMonthStart(now);
      const prevEnd = getPreviousMonthEnd(now);
      const todayStart = getTodayStart();
      const todayEnd = getTodayEnd();
      const weekStart = getWeekStart(now);
      const weekEnd = getWeekEnd(now);
      const chartStart = getDaysAgoStart(chartDays);

      const [
        monthSummary,
        prevMonthSummary,
        todaySummary,
        weekSummary,
        dailySpending,
        categorySpending,
        recentTransactions,
        pendingTransactions,
        budgetProgress,
      ] = await Promise.all([
        getTransactionSummary(monthStart, monthEnd),
        getTransactionSummary(prevStart, prevEnd),
        getTransactionSummary(todayStart, todayEnd),
        getTransactionSummary(weekStart, weekEnd),
        getDailySpending(chartStart, monthEnd),
        getCategorySpending(monthStart, monthEnd),
        getRecentTransactions(10),
        getPendingTransactions(),
        getBudgetProgress(monthStart, monthEnd),
      ]);

      const monthChange =
        prevMonthSummary.totalExpense > 0
          ? Math.round(
              ((monthSummary.totalExpense - prevMonthSummary.totalExpense) /
                prevMonthSummary.totalExpense) *
                100,
            )
          : 0;

      // Average daily spending this month
      const daysInMonth = now.getDate();
      const avgDailySpending =
        daysInMonth > 0
          ? (Math.round(monthSummary.totalExpense / daysInMonth) as Paise)
          : (0 as Paise);

      setData({
        monthSummary,
        prevMonthSummary,
        monthChange,
        todaySpending: todaySummary.totalExpense,
        weekSpending: weekSummary.totalExpense,
        avgDailySpending,
        dailySpending,
        categorySpending,
        recentTransactions,
        pendingTransactions,
        budgetProgress,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
      }));
    }
  }, [chartDays]);

  useEffect(() => {
    void refresh();
  }, [refresh, dataVersion]);

  return data;
}
