import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import {
  PieChart,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import {
  getTransactionSummary,
  getDailySpending,
  getCategorySpending,
  getTransactions,
} from '../../src/database/repositories/transactionRepository';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { dataChanged } from '../../src/store/slices/appSlice';
import { formatPaise } from '../../src/utils/currency';
import {
  getMonthStart,
  getMonthEnd,
  getPreviousMonthStart,
  getPreviousMonthEnd,
  getDaysAgoStart,
} from '../../src/utils/dates';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Card } from '../../src/components/ui/Card';
import { CategoryBreakdownChart } from '../../src/components/charts/CategoryBreakdownChart';
import { DailySpendingBarChart } from '../../src/components/charts/DailySpendingBarChart';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import type {
  TransactionSummary,
  DailySpending,
  CategorySpending,
  Transaction,
} from '../../src/types/transaction.types';
import type { Paise } from '../../src/utils/currency';

type PeriodType = 'this_month' | 'last_month' | '90_days' | 'all';

export default function AnalyticsScreen() {
  const dispatch = useAppDispatch();
  const dataVersion = useAppSelector((s) => s.app.dataVersion);

  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [isLoading, setIsLoading] = useState(true);

  const [summary, setSummary] = useState<TransactionSummary>({
    totalExpense: 0 as Paise,
    totalIncome: 0 as Paise,
    transactionCount: 0,
    categorizedCount: 0,
    pendingCount: 0,
  });

  const [dailyData, setDailyData] = useState<DailySpending[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [topMerchants, setTopMerchants] = useState<{ merchant: string; total: Paise; count: number }[]>([]);

  useEffect(() => {
    void loadAnalytics();
  }, [period, dataVersion]);

  async function loadAnalytics() {
    setIsLoading(true);
    try {
      const now = new Date();
      let start: string;
      let end: string;

      switch (period) {
        case 'last_month':
          start = getPreviousMonthStart(now);
          end = getPreviousMonthEnd(now);
          break;
        case '90_days':
          start = getDaysAgoStart(90);
          end = getMonthEnd(now);
          break;
        case 'all':
          start = '2000-01-01T00:00:00.000Z';
          end = '2099-12-31T23:59:59.999Z';
          break;
        case 'this_month':
        default:
          start = getMonthStart(now);
          end = getMonthEnd(now);
          break;
      }

      const [sum, daily, cats, allTxns] = await Promise.all([
        getTransactionSummary(start, end),
        getDailySpending(start, end),
        getCategorySpending(start, end),
        getTransactions({ startDate: start, endDate: end, transactionTypes: ['expense'] }),
      ]);

      setSummary(sum);
      setDailyData(daily);
      setCategoryData(cats);

      // Aggregate top merchants
      const merchantMap: { [key: string]: { total: number; count: number } } = {};
      for (const t of allTxns) {
        if (t.isExcluded) continue;
        const name = t.merchantName || 'Unknown Merchant';
        if (!merchantMap[name]) {
          merchantMap[name] = { total: 0, count: 0 };
        }
        merchantMap[name].total += t.amountMinor;
        merchantMap[name].count += 1;
      }

      const sortedMerchants = Object.entries(merchantMap)
        .map(([merchant, val]) => ({
          merchant,
          total: val.total as Paise,
          count: val.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopMerchants(sortedMerchants);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const topCategory = categoryData[0];
  const daysInPeriod =
    period === 'this_month'
      ? Math.max(1, new Date().getDate())
      : period === 'last_month'
      ? 30
      : period === '90_days'
      ? 90
      : Math.max(1, dailyData.length);

  const avgDaily = Math.round(summary.totalExpense / daysInPeriod) as Paise;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => dispatch(dataChanged())}
            tintColor="#6F7F52"
          />
        }
      >
        {/* Header */}
        <View className="mt-2 mb-3">
          <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">
            Spending Analytics
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            Comprehensive breakdown of your personal finances
          </Text>
        </View>

        {/* Period Selector Tabs */}
        <View className="flex-row bg-surface dark:bg-surface-dark p-1 rounded-2xl mb-4 border border-line dark:border-line-dark shadow-sm">
          <Pressable
            onPress={() => setPeriod('this_month')}
            className={`flex-1 py-2 rounded-xl items-center ${
              period === 'this_month' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                period === 'this_month' ? 'text-white' : 'text-muted dark:text-muted-dark'
              }`}
            >
              This Month
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPeriod('last_month')}
            className={`flex-1 py-2 rounded-xl items-center ${
              period === 'last_month' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                period === 'last_month' ? 'text-white' : 'text-muted dark:text-muted-dark'
              }`}
            >
              Last Month
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPeriod('90_days')}
            className={`flex-1 py-2 rounded-xl items-center ${
              period === '90_days' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                period === '90_days' ? 'text-white' : 'text-muted dark:text-muted-dark'
              }`}
            >
              90 Days
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPeriod('all')}
            className={`flex-1 py-2 rounded-xl items-center ${
              period === 'all' ? 'bg-accent' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                period === 'all' ? 'text-white' : 'text-muted dark:text-muted-dark'
              }`}
            >
              All Time
            </Text>
          </Pressable>
        </View>

        {/* Stat Cards Grid */}
        <SlideUpReveal index={0}>
          <View className="flex-row gap-x-3 mb-3">
            <View className="flex-1 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-line/80 dark:border-line-dark shadow-sm">
              <Text className="text-[11px] font-bold text-muted dark:text-muted-dark uppercase">
                Total Outflow
              </Text>
              <Text className="text-xl font-extrabold text-ink dark:text-ink-dark mt-1">
                {formatPaise(summary.totalExpense)}
              </Text>
              <Text className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                {summary.transactionCount} transactions
              </Text>
            </View>

            <View className="flex-1 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-line/80 dark:border-line-dark shadow-sm">
              <Text className="text-[11px] font-bold text-muted dark:text-muted-dark uppercase">
                Daily Average
              </Text>
              <Text className="text-xl font-extrabold text-accent mt-1">
                {formatPaise(avgDaily)}
              </Text>
              <Text className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                over {daysInPeriod} days
              </Text>
            </View>
          </View>
        </SlideUpReveal>

        {/* Spending Insight Card */}
        {topCategory && (
          <SlideUpReveal index={1}>
            <View className="bg-accent/10 dark:bg-accent/15 p-4 rounded-2xl border border-accent/25 mb-4 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-accent items-center justify-center mr-3">
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                  Top Spending Insight
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 leading-4">
                  <Text className="font-semibold text-accent">{topCategory.categoryName}</Text> is your highest expense area, accounting for <Text className="font-bold text-ink dark:text-ink-dark">{topCategory.percentage}%</Text> ({formatPaise(topCategory.totalMinor)}) of your total spending.
                </Text>
              </View>
            </View>
          </SlideUpReveal>
        )}

        {/* Daily Spending Trend Chart */}
        <SlideUpReveal index={2}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-ink dark:text-ink-dark">
                Daily Expense Trend
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark">
                Day-by-day activity
              </Text>
            </View>
            <DailySpendingBarChart data={dailyData} />
          </Card>
        </SlideUpReveal>

        {/* Category Breakdown Card */}
        <SlideUpReveal index={3}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <Text className="text-base font-bold text-ink dark:text-ink-dark mb-4">
              Category Distribution
            </Text>
            <CategoryBreakdownChart categories={categoryData} />
          </Card>
        </SlideUpReveal>

        {/* Top Merchants Leaderboard */}
        {topMerchants.length > 0 && (
          <SlideUpReveal index={4}>
            <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
              <Text className="text-base font-bold text-ink dark:text-ink-dark mb-3">
                Top Merchants
              </Text>
              <View className="gap-y-3">
                {topMerchants.map((m, index) => (
                  <View
                    key={m.merchant}
                    className="flex-row items-center justify-between py-1 border-b border-line/40 dark:border-line-dark/40 pb-2"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-6 h-6 rounded-full bg-bg dark:bg-bg-dark items-center justify-center mr-2.5 border border-line dark:border-line-dark">
                        <Text className="text-[11px] font-bold text-muted dark:text-muted-dark">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-xs font-bold text-ink dark:text-ink-dark"
                          numberOfLines={1}
                        >
                          {m.merchant}
                        </Text>
                        <Text className="text-[10px] text-muted dark:text-muted-dark">
                          {m.count} {m.count === 1 ? 'transaction' : 'transactions'}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                      {formatPaise(m.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </SlideUpReveal>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
