import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import {
  Search,
  X,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react-native';
import { getTransactions } from '../../src/database/repositories/transactionRepository';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { dataChanged } from '../../src/store/slices/appSlice';
import { formatPaise } from '../../src/utils/currency';
import { formatDateShort } from '../../src/utils/dates';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TransactionRow } from '../../src/components/ui/TransactionRow';
import { CategoryPickerModal } from '../../src/components/ui/CategoryPickerModal';
import { TransactionDetailModal } from '../../src/components/ui/TransactionDetailModal';
import { AddTransactionModal } from '../../src/components/ui/AddTransactionModal';
import { PressScale } from '../../src/components/animations/PressScale';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import type { Transaction } from '../../src/types/transaction.types';
import { CategorizationStatus, TransactionType } from '../../src/types/transaction.types';

type FilterType = 'all' | 'pending' | 'expense' | 'income' | 'demo' | 'excluded';

export default function TransactionsScreen() {
  const dispatch = useAppDispatch();
  const dataVersion = useAppSelector((s) => s.app.dataVersion);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryModalTxn, setCategoryModalTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    void loadTransactions();
  }, [dataVersion]);

  async function loadTransactions() {
    setIsLoading(true);
    try {
      const list = await getTransactions({});
      setTransactions(list);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filter tab
      if (activeFilter === 'pending' && t.categorizationStatus !== CategorizationStatus.PENDING) {
        return false;
      }
      if (activeFilter === 'expense' && t.transactionType !== TransactionType.EXPENSE) {
        return false;
      }
      if (activeFilter === 'income' && t.transactionType !== TransactionType.INCOME && t.transactionType !== TransactionType.REFUND) {
        return false;
      }
      if (activeFilter === 'demo' && t.source !== 'demo') {
        return false;
      }
      if (activeFilter === 'excluded' && !t.isExcluded) {
        return false;
      }
      if (activeFilter !== 'excluded' && t.isExcluded && activeFilter !== 'all') {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const merchantMatch = t.merchantName?.toLowerCase().includes(q) ?? false;
        const notesMatch = t.notes?.toLowerCase().includes(q) ?? false;
        const refMatch = t.transactionReference?.toLowerCase().includes(q) ?? false;
        const aliasMatch = t.accountAlias?.toLowerCase().includes(q) ?? false;
        const amountMatch = (t.amountMinor / 100).toString().includes(q);
        return merchantMatch || notesMatch || refMatch || aliasMatch || amountMatch;
      }

      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const txn of filteredTransactions) {
      const dateStr = txn.transactionDate.split('T')[0];
      let label = formatDateShort(txn.transactionDate);

      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(txn);
    }

    return groups;
  }, [filteredTransactions]);

  // Export CSV
  async function handleExportCsv() {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'There are no transactions to export.');
      return;
    }

    const headers = 'ID,Date,Merchant,Amount (INR),Type,Category,Status,Source,Reference\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.transactionDate}","${t.merchantName || ''}",${t.amountMinor / 100},"${
            t.transactionType
          }","${t.categoryId || ''}","${t.categorizationStatus}","${t.source}","${
            t.transactionReference || ''
          }"`,
      )
      .join('\n');

    const csvContent = headers + rows;

    try {
      await Share.share({
        message: csvContent,
        title: 'Spendly_Transactions.csv',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }

  const pendingCount = transactions.filter(
    (t) => t.categorizationStatus === CategorizationStatus.PENDING,
  ).length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-3">
        <View>
          <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">
            Transactions
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {transactions.length} total entries • 100% offline
          </Text>
        </View>

        <View className="flex-row items-center gap-x-2">
          <PressScale onPress={handleExportCsv}>
            <View className="w-10 h-10 rounded-2xl bg-surface dark:bg-surface-dark items-center justify-center border border-line dark:border-line-dark shadow-sm">
              <Download size={18} color="#6F7F52" />
            </View>
          </PressScale>

          <PressScale onPress={() => setAddModalVisible(true)}>
            <View className="w-10 h-10 rounded-2xl bg-accent items-center justify-center shadow-md">
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </PressScale>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-surface dark:bg-surface-dark px-3.5 py-2.5 rounded-2xl border border-line dark:border-line-dark mb-3 shadow-sm">
        <Search size={18} color="#737970" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search merchant, amount, note, UPI ref..."
          placeholderTextColor="#737970"
          className="flex-1 text-sm font-medium text-ink dark:text-ink-dark ml-2.5 py-0"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={16} color="#737970" />
          </Pressable>
        )}
      </View>

      {/* Filter Chips Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row mb-3 max-h-10"
      >
        <Pressable
          onPress={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl mr-2 border ${
            activeFilter === 'all'
              ? 'bg-accent border-accent'
              : 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'all' ? 'text-white' : 'text-muted dark:text-muted-dark'
            }`}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl mr-2 border flex-row items-center ${
            activeFilter === 'pending'
              ? 'bg-amber-500 border-amber-500'
              : 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark'
          }`}
        >
          {pendingCount > 0 && (
            <View className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
          )}
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'pending'
                ? 'text-white'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            Needs Category ({pendingCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('expense')}
          className={`px-3.5 py-1.5 rounded-xl mr-2 border ${
            activeFilter === 'expense'
              ? 'bg-accent border-accent'
              : 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'expense' ? 'text-white' : 'text-muted dark:text-muted-dark'
            }`}
          >
            Expenses
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('income')}
          className={`px-3.5 py-1.5 rounded-xl mr-2 border ${
            activeFilter === 'income'
              ? 'bg-accent border-accent'
              : 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'income' ? 'text-white' : 'text-muted dark:text-muted-dark'
            }`}
          >
            Income / Refunds
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('demo')}
          className={`px-3.5 py-1.5 rounded-xl mr-2 border ${
            activeFilter === 'demo'
              ? 'bg-accent border-accent'
              : 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'demo' ? 'text-white' : 'text-muted dark:text-muted-dark'
            }`}
          >
            Demo Items
          </Text>
        </Pressable>
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTransactions}
            tintColor="#6F7F52"
          />
        }
      >
        {filteredTransactions.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <View className="w-14 h-14 rounded-2xl bg-bg dark:bg-bg-dark items-center justify-center mb-3">
              <Search size={24} color="#737970" />
            </View>
            <Text className="text-base font-bold text-ink dark:text-ink-dark">
              No transactions found
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1">
              Try adjusting your search query or filter chips
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([groupLabel, txns]) => (
            <View key={groupLabel} className="mb-4">
              <Text className="text-xs font-bold text-muted dark:text-muted-dark uppercase tracking-wider mb-2 px-1">
                {groupLabel}
              </Text>
              {txns.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  onPress={() => setSelectedTransaction(txn)}
                  onCategorizePress={() => setCategoryModalTxn(txn)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
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
