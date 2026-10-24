import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  Calendar,
  CreditCard,
  Hash,
  Tag,
  Trash2,
  EyeOff,
  Eye,
  MessageSquare,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { formatPaise } from '../../utils/currency';
import { formatDateFull, formatTime } from '../../utils/dates';
import { CategoryIcon } from './CategoryIcon';
import { CategoryBadge } from './CategoryBadge';
import { DEFAULT_CATEGORIES } from '../../types/category.types';
import type { Transaction } from '../../types/transaction.types';
import { TransactionType, CategorizationStatus } from '../../types/transaction.types';
import {
  excludeTransaction,
  deleteTransaction,
} from '../../database/repositories/transactionRepository';
import { useAppDispatch } from '../../store/hooks';
import { dataChanged } from '../../store/slices/appSlice';
import { PressScale } from '../animations/PressScale';

interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEditCategory: () => void;
}

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
  onEditCategory,
}: TransactionDetailModalProps) {
  const dispatch = useAppDispatch();

  if (!transaction) return null;

  const isIncome =
    transaction.transactionType === TransactionType.INCOME ||
    transaction.transactionType === TransactionType.REFUND;

  const category = DEFAULT_CATEGORIES.find((c) => c.id === transaction.categoryId);
  const categoryName = category?.name ?? 'Uncategorized';
  const categoryIcon = category?.icon ?? 'more-horizontal';
  const categoryColor = category?.colorToken ?? '#95A5A6';
  const isPending = transaction.categorizationStatus === CategorizationStatus.PENDING;

  async function handleToggleExclude() {
    if (!transaction) return;
    const newExcluded = !transaction.isExcluded;
    await excludeTransaction(transaction.id, newExcluded);
    dispatch(dataChanged());
    onClose();
  }

  function handleDelete() {
    if (!transaction) return;
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction record? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(transaction.id);
            dispatch(dataChanged());
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[90%] border-t border-line dark:border-line-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-3 border-b border-line/60 dark:border-line-dark/60">
            <Text className="text-xl font-bold text-ink dark:text-ink-dark">
              Transaction Details
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-bg dark:bg-bg-dark items-center justify-center"
            >
              <X size={18} color="#737970" />
            </Pressable>
          </View>

          <ScrollView
            className="px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Amount Hero */}
            <View className="items-center py-5 bg-bg dark:bg-bg-dark rounded-3xl mb-5 border border-line/50 dark:border-line-dark/50">
              <Text className="text-xs uppercase tracking-wider font-semibold text-muted dark:text-muted-dark mb-1">
                {transaction.transactionType}
              </Text>
              <Text
                className={`text-4xl font-extrabold ${
                  isIncome
                    ? 'text-positive dark:text-positive'
                    : 'text-ink dark:text-ink-dark'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatPaise(transaction.amountMinor)}
              </Text>
              <Text className="text-base font-semibold text-ink dark:text-ink-dark mt-1">
                {transaction.merchantName || 'Unknown Merchant'}
              </Text>

              {transaction.isExcluded && (
                <View className="mt-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Excluded from Expense Totals
                  </Text>
                </View>
              )}
            </View>

            {/* Category Section */}
            <View className="mb-4 bg-bg dark:bg-bg-dark p-4 rounded-2xl border border-line/60 dark:border-line-dark/60">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Tag size={18} color="#737970" className="mr-2" />
                  <Text className="text-sm font-semibold text-muted dark:text-muted-dark ml-2">
                    Category
                  </Text>
                </View>
                <PressScale onPress={onEditCategory}>
                  <View className="flex-row items-center">
                    <CategoryBadge
                      name={categoryName}
                      icon={categoryIcon}
                      color={categoryColor}
                      isPending={isPending}
                    />
                    <Text className="text-xs font-bold text-accent ml-2">
                      Change
                    </Text>
                  </View>
                </PressScale>
              </View>
            </View>

            {/* Info Grid */}
            <View className="bg-bg dark:bg-bg-dark p-4 rounded-2xl border border-line/60 dark:border-line-dark/60 gap-y-3.5 mb-5">
              {/* Date & Time */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Calendar size={16} color="#737970" />
                  <Text className="text-xs text-muted dark:text-muted-dark ml-2.5">
                    Date & Time
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-ink dark:text-ink-dark">
                  {formatDateFull(transaction.transactionDate)}, {formatTime(transaction.transactionDate)}
                </Text>
              </View>

              {/* Account / Card */}
              {transaction.accountAlias && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <CreditCard size={16} color="#737970" />
                    <Text className="text-xs text-muted dark:text-muted-dark ml-2.5">
                      Account / Card
                    </Text>
                  </View>
                  <Text className="text-xs font-semibold text-ink dark:text-ink-dark">
                    {transaction.accountAlias}
                  </Text>
                </View>
              )}

              {/* Reference / UTR */}
              {transaction.transactionReference && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Hash size={16} color="#737970" />
                    <Text className="text-xs text-muted dark:text-muted-dark ml-2.5">
                      Reference / UTR
                    </Text>
                  </View>
                  <Text className="text-xs font-mono font-medium text-ink dark:text-ink-dark">
                    {transaction.transactionReference}
                  </Text>
                </View>
              )}

              {/* Source */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MessageSquare size={16} color="#737970" />
                  <Text className="text-xs text-muted dark:text-muted-dark ml-2.5">
                    Source
                  </Text>
                </View>
                <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded border border-line dark:border-line-dark">
                  <Text className="text-[11px] font-semibold text-accent uppercase">
                    {transaction.source}
                  </Text>
                </View>
              </View>

              {/* Notes if any */}
              {transaction.notes && (
                <View className="flex-row items-start justify-between pt-1">
                  <View className="flex-row items-center">
                    <FileText size={16} color="#737970" />
                    <Text className="text-xs text-muted dark:text-muted-dark ml-2.5">
                      Notes
                    </Text>
                  </View>
                  <Text className="text-xs text-ink dark:text-ink-dark flex-1 text-right ml-4">
                    {transaction.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Offline Privacy Badge */}
            <View className="flex-row items-center justify-center mb-6">
              <ShieldCheck size={14} color="#6F7F52" />
              <Text className="text-[11px] text-muted dark:text-muted-dark ml-1.5">
                Saved 100% locally on your device
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="gap-y-3">
              <PressScale onPress={handleToggleExclude}>
                <View className="py-3.5 px-4 rounded-2xl bg-bg dark:bg-bg-dark border border-line dark:border-line-dark flex-row items-center justify-center">
                  {transaction.isExcluded ? (
                    <>
                      <Eye size={18} color="#6F7F52" />
                      <Text className="text-sm font-semibold text-accent ml-2">
                        Include in Totals
                      </Text>
                    </>
                  ) : (
                    <>
                      <EyeOff size={18} color="#737970" />
                      <Text className="text-sm font-semibold text-muted dark:text-muted-dark ml-2">
                        Exclude from Totals
                      </Text>
                    </>
                  )}
                </View>
              </PressScale>

              <PressScale onPress={handleDelete}>
                <View className="py-3.5 px-4 rounded-2xl bg-danger/10 border border-danger/20 flex-row items-center justify-center">
                  <Trash2 size={18} color="#CF625C" />
                  <Text className="text-sm font-semibold text-danger ml-2">
                    Delete Transaction
                  </Text>
                </View>
              </PressScale>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
