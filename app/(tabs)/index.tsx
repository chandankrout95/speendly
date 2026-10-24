import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, DeviceEventEmitter, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { getTransactionById } from '../../src/database/repositories/transactionRepository';
import {
  Plus,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Database,
  ShieldCheck,
  Wallet,
  Clock,
} from 'lucide-react-native';
import { useDashboard } from '../../src/features/dashboard/hooks/useDashboard';
import { seedDemoData } from '../../src/features/demo/seedDemoData';
import { checkPermissions, requestSmsAndNotificationPermissions } from '../../src/features/sms/services/permission.service';
import { useAppDispatch } from '../../src/store/hooks';
import { dataChanged } from '../../src/store/slices/appSlice';
import { formatPaise } from '../../src/utils/currency';
import { getGreeting } from '../../src/utils/dates';
import { AmountText } from '../../src/components/ui/AmountText';
import { Card } from '../../src/components/ui/Card';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TransactionRow } from '../../src/components/ui/TransactionRow';
import { CategoryPickerModal } from '../../src/components/ui/CategoryPickerModal';
import { TransactionDetailModal } from '../../src/components/ui/TransactionDetailModal';
import { AddTransactionModal } from '../../src/components/ui/AddTransactionModal';
import { SmsSimulateModal } from '../../src/components/ui/SmsSimulateModal';
import { CategoryBreakdownChart } from '../../src/components/charts/CategoryBreakdownChart';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import { PressScale } from '../../src/components/animations/PressScale';
import type { Transaction } from '../../src/types/transaction.types';

export default function DashboardScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const dashboard = useDashboard(30);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryModalTxn, setCategoryModalTxn] = useState<Transaction | null>(null);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const lastAutoOpenedId = React.useRef<string | null>(null);

  useEffect(() => {
    void checkPermissions().then((status) => {
      setSmsPermissionGranted(status.smsGranted);
    });

    // 1. Live SMS/Notification event listener from native Kotlin
    const nativeSub = DeviceEventEmitter.addListener(
      'spendly_new_transaction',
      async (event: {
        id: string;
        amount: number;
        merchant?: string;
        isDebit: boolean;
        body: string;
        sender: string;
      }) => {
        console.log('[Spendly] Received native SMS/Notification event:', event.id);
        const txn = await getTransactionById(event.id);
        if (txn) {
          lastAutoOpenedId.current = txn.id;
          setCategoryModalTxn(txn);
        } else {
          // Fallback with event details
          const fallbackTxn: Transaction = {
            id: event.id,
            amountMinor: Math.round(event.amount * 100) as any,
            currency: 'INR',
            transactionType: event.isDebit ? ('expense' as any) : ('income' as any),
            categoryId: null,
            merchantName: event.merchant || null,
            transactionReference: null,
            transactionDate: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            source: 'sms' as any,
            categorizationStatus: 'pending' as any,
            confidence: 0.9,
            fingerprint: '',
          };
          lastAutoOpenedId.current = fallbackTxn.id;
          setCategoryModalTxn(fallbackTxn);
        }
      },
    );

    // 2. Handle deep link from Notification tap: spendly://categorize?id=...
    async function handleDeepLink(url: string | null) {
      if (!url) return;
      try {
        const idMatch = url.match(/[?&]id=([^&#]+)/);
        if (idMatch && idMatch[1]) {
          const txnId = decodeURIComponent(idMatch[1]);
          console.log('[Spendly] Deep link requested categorization for txn:', txnId);
          const txn = await getTransactionById(txnId);
          if (txn) {
            lastAutoOpenedId.current = txn.id;
            setCategoryModalTxn(txn);
          }
        }
      } catch (e) {
        console.log('[Spendly] Error parsing deep link URL:', e);
      }
    }

    void Linking.getInitialURL().then(handleDeepLink);
    const linkingSub = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

    return () => {
      nativeSub.remove();
      linkingSub.remove();
    };
  }, []);

  // Automatically pop up categorization modal when a pending transaction is received
  useEffect(() => {
    if (
      dashboard.pendingTransactions.length > 0 &&
      !categoryModalTxn &&
      !addModalVisible &&
      !smsModalVisible
    ) {
      const latest = dashboard.pendingTransactions[0];
      if (latest.id !== lastAutoOpenedId.current) {
        lastAutoOpenedId.current = latest.id;
        console.log('[Spendly] Auto-opening category modal for pending txn:', latest.id);
        setCategoryModalTxn(latest);
      }
    }
  }, [dashboard.pendingTransactions, categoryModalTxn, addModalVisible, smsModalVisible]);

  async function handleRequestPermission() {
    const granted = await requestSmsAndNotificationPermissions();
    setSmsPermissionGranted(granted);
    if (granted) {
      dispatch(dataChanged());
    }
  }

  async function handleLoadDemo() {
    setIsSeeding(true);
    await seedDemoData();
    dispatch(dataChanged());
    setIsSeeding(false);
  }

  const primaryBudget = dashboard.budgetProgress[0];
  const greeting = getGreeting();

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isLoading}
            onRefresh={() => dispatch(dataChanged())}
            tintColor="#6F7F52"
          />
        }
      >
        {/* Top Header */}
        <SlideUpReveal index={0}>
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <View>
              <Text className="text-xs font-bold text-accent uppercase tracking-wider">
                Spendly • Offline
              </Text>
              <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">
                {greeting}
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View className="flex-row items-center gap-x-2">
              <PressScale onPress={() => setSmsModalVisible(true)}>
                <View className="w-10 h-10 rounded-2xl bg-surface dark:bg-surface-dark items-center justify-center border border-line dark:border-line-dark shadow-sm">
                  <Sparkles size={18} color="#6F7F52" />
                </View>
              </PressScale>

              <PressScale onPress={() => setAddModalVisible(true)}>
                <View className="w-10 h-10 rounded-2xl bg-accent items-center justify-center shadow-md">
                  <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </PressScale>
            </View>
          </View>
        </SlideUpReveal>

        {/* SMS Permission Banner if not granted */}
        {!smsPermissionGranted && (
          <SlideUpReveal index={0}>
            <View className="bg-accent/15 dark:bg-accent/20 p-4 rounded-2xl border border-accent/40 mb-4 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-9 h-9 rounded-xl bg-accent items-center justify-center mr-3">
                  <Sparkles size={18} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                    Enable SMS Auto-Tracking
                  </Text>
                  <Text className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                    Allow Spendly to automatically detect bank alerts
                  </Text>
                </View>
              </View>
              <PressScale onPress={handleRequestPermission}>
                <View className="bg-accent px-3 py-1.5 rounded-xl shadow">
                  <Text className="text-xs font-bold text-white">Enable</Text>
                </View>
              </PressScale>
            </View>
          </SlideUpReveal>
        )}

        {/* Pending Categorization Banner */}
        {dashboard.pendingTransactions.length > 0 && (
          <SlideUpReveal index={1}>
            <PressScale
              onPress={() => setCategoryModalTxn(dashboard.pendingTransactions[0])}
            >
              <View className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800 mb-4 flex-row items-center justify-between shadow-sm">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
                    <AlertCircle size={20} color="#D69A45" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {dashboard.pendingTransactions.length}{' '}
                      {dashboard.pendingTransactions.length === 1
                        ? 'Transaction Needs Category'
                        : 'Transactions Need Category'}
                    </Text>
                    <Text className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Tap to review and assign category
                    </Text>
                  </View>
                </View>
                <View className="bg-amber-500 px-3 py-1.5 rounded-xl">
                  <Text className="text-xs font-bold text-white">Categorize</Text>
                </View>
              </View>
            </PressScale>
          </SlideUpReveal>
        )}

        {/* Hero Card: Monthly Spending */}
        <SlideUpReveal index={2}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs uppercase tracking-wider font-bold text-muted dark:text-muted-dark">
                This Month&apos;s Spend
              </Text>
              {dashboard.monthChange !== 0 && (
                <View
                  className={`flex-row items-center px-2 py-0.5 rounded-full ${
                    dashboard.monthChange > 0
                      ? 'bg-danger/10'
                      : 'bg-positive/10'
                  }`}
                >
                  {dashboard.monthChange > 0 ? (
                    <TrendingUp size={12} color="#CF625C" />
                  ) : (
                    <TrendingDown size={12} color="#3D8B68" />
                  )}
                  <Text
                    className={`text-[10px] font-bold ml-1 ${
                      dashboard.monthChange > 0
                        ? 'text-danger'
                        : 'text-positive'
                    }`}
                  >
                    {Math.abs(dashboard.monthChange)}% vs last month
                  </Text>
                </View>
              )}
            </View>

            <AmountText amountMinor={dashboard.monthSummary.totalExpense} size="xl" />

            {/* Quick stats row */}
            <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-line/60 dark:border-line-dark/60">
              <View>
                <Text className="text-[11px] text-muted dark:text-muted-dark font-medium">
                  Daily Average
                </Text>
                <Text className="text-sm font-bold text-ink dark:text-ink-dark mt-0.5">
                  {formatPaise(dashboard.avgDailySpending)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[11px] text-muted dark:text-muted-dark font-medium">
                  Total Transactions
                </Text>
                <Text className="text-sm font-bold text-ink dark:text-ink-dark mt-0.5">
                  {dashboard.monthSummary.transactionCount}
                </Text>
              </View>
            </View>

            {/* Primary Budget Progress Bar if configured */}
            {primaryBudget && (
              <View className="mt-4 pt-3 border-t border-line/60 dark:border-line-dark/60">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs font-semibold text-ink dark:text-ink-dark">
                    {primaryBudget.budget.name}
                  </Text>
                  <Text
                    className={`text-xs font-bold ${
                      primaryBudget.isExceeded
                        ? 'text-danger'
                        : primaryBudget.isApproaching
                        ? 'text-warning'
                        : 'text-accent'
                    }`}
                  >
                    {primaryBudget.percentage}% spent
                  </Text>
                </View>
                <View className="h-2.5 w-full rounded-full bg-bg dark:bg-bg-dark overflow-hidden">
                  <View
                    style={{
                      width: `${Math.min(100, primaryBudget.percentage)}%`,
                    }}
                    className={`h-full rounded-full ${
                      primaryBudget.isExceeded
                        ? 'bg-danger'
                        : primaryBudget.isApproaching
                        ? 'bg-warning'
                        : 'bg-accent'
                    }`}
                  />
                </View>
                <Text className="text-[11px] text-muted dark:text-muted-dark mt-1">
                  {formatPaise(primaryBudget.remainingMinor)} remaining of {formatPaise(primaryBudget.budget.amountMinor)}
                </Text>
              </View>
            )}
          </Card>
        </SlideUpReveal>

        {/* Empty State Banner if no transactions */}
        {dashboard.recentTransactions.length === 0 && !dashboard.isLoading && (
          <SlideUpReveal index={3}>
            <View className="p-6 bg-surface dark:bg-surface-dark rounded-3xl border border-line dark:border-line-dark items-center text-center my-2 shadow-sm">
              <View className="w-14 h-14 rounded-2xl bg-accent/15 items-center justify-center mb-3">
                <Sparkles size={28} color="#6F7F52" />
              </View>
              <Text className="text-lg font-bold text-ink dark:text-ink-dark text-center">
                Start Tracking Your Expenses
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 mb-4 leading-4">
                Spendly automatically reads eligible Indian bank transaction SMS or you can explore with sample data.
              </Text>

              <View className="flex-row gap-x-2.5 w-full">
                <PressScale
                  onPress={handleLoadDemo}
                  style={{ flex: 1 }}
                >
                  <View className="bg-bg dark:bg-bg-dark py-3 rounded-2xl items-center border border-line dark:border-line-dark flex-row justify-center">
                    <Database size={16} color="#6F7F52" />
                    <Text className="text-xs font-bold text-ink dark:text-ink-dark ml-1.5">
                      {isSeeding ? 'Loading...' : 'Demo Data'}
                    </Text>
                  </View>
                </PressScale>

                <PressScale
                  onPress={() => setSmsModalVisible(true)}
                  style={{ flex: 1 }}
                >
                  <View className="bg-accent py-3 rounded-2xl items-center flex-row justify-center shadow">
                    <Sparkles size={16} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white ml-1.5">
                      Test Bank SMS
                    </Text>
                  </View>
                </PressScale>
              </View>
            </View>
          </SlideUpReveal>
        )}

        {/* Category Breakdown Card */}
        {dashboard.categorySpending.length > 0 && (
          <SlideUpReveal index={3}>
            <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-ink dark:text-ink-dark">
                  Top Spending Categories
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/analytics')}
                  hitSlop={8}
                  className="flex-row items-center"
                >
                  <Text className="text-xs font-bold text-accent mr-1">
                    Details
                  </Text>
                  <ArrowRight size={14} color="#6F7F52" />
                </Pressable>
              </View>
              <CategoryBreakdownChart
                categories={dashboard.categorySpending.slice(0, 5)}
                onCategoryPress={() => router.push('/(tabs)/analytics')}
              />
            </Card>
          </SlideUpReveal>
        )}

        {/* Recent Transactions List */}
        {dashboard.recentTransactions.length > 0 && (
          <SlideUpReveal index={4}>
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-base font-bold text-ink dark:text-ink-dark">
                  Recent Transactions
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/transactions')}
                  hitSlop={8}
                  className="flex-row items-center"
                >
                  <Text className="text-xs font-bold text-accent mr-1">
                    See All ({dashboard.monthSummary.transactionCount})
                  </Text>
                  <ArrowRight size={14} color="#6F7F52" />
                </Pressable>
              </View>

              {dashboard.recentTransactions.slice(0, 6).map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  onPress={() => setSelectedTransaction(txn)}
                  onCategorizePress={() => setCategoryModalTxn(txn)}
                />
              ))}
            </View>
          </SlideUpReveal>
        )}

        {/* Privacy Offline Guarantee Badge */}
        <View className="flex-row items-center justify-center py-4">
          <ShieldCheck size={14} color="#6F7F52" />
          <Text className="text-[11px] text-muted dark:text-muted-dark ml-1.5">
            100% Offline • Zero Analytics • Local SQLite Storage
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />

      <SmsSimulateModal
        visible={smsModalVisible}
        onClose={() => setSmsModalVisible(false)}
      />

      <CategoryPickerModal
        visible={categoryModalTxn !== null}
        onClose={() => setCategoryModalTxn(null)}
        transactionId={categoryModalTxn?.id ?? null}
        currentCategoryId={categoryModalTxn?.categoryId}
        merchantName={categoryModalTxn?.merchantName}
      />

      <TransactionDetailModal
        visible={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onEditCategory={() => {
          const t = selectedTransaction;
          setSelectedTransaction(null);
          setCategoryModalTxn(t);
        }}
      />
    </ScreenContainer>
  );
}
