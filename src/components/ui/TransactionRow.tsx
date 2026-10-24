import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { formatPaise } from '../../utils/currency';
import { formatRelativeDate, formatTime } from '../../utils/dates';
import { CategoryIcon } from './CategoryIcon';
import { CategoryBadge } from './CategoryBadge';
import { DEFAULT_CATEGORIES } from '../../types/category.types';
import type { Transaction } from '../../types/transaction.types';
import { TransactionType, CategorizationStatus } from '../../types/transaction.types';
import { PressScale } from '../animations/PressScale';
import { Sparkles, MessageSquare } from 'lucide-react-native';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
  onCategorizePress?: () => void;
}

export function TransactionRow({
  transaction,
  onPress,
  onCategorizePress,
}: TransactionRowProps) {
  const isIncome =
    transaction.transactionType === TransactionType.INCOME ||
    transaction.transactionType === TransactionType.REFUND;

  const isPending =
    transaction.categorizationStatus === CategorizationStatus.PENDING ||
    !transaction.categoryId;

  const category = DEFAULT_CATEGORIES.find((c) => c.id === transaction.categoryId);
  const categoryName = category?.name ?? 'Uncategorized';
  const categoryIcon = category?.icon ?? 'more-horizontal';
  const categoryColor = isPending ? '#D69A45' : category?.colorToken ?? '#95A5A6';

  const title =
    transaction.merchantName ||
    (transaction.transactionType === TransactionType.INCOME
      ? 'Received Funds'
      : transaction.transactionType === TransactionType.TRANSFER
      ? 'Account Transfer'
      : 'Expense');

  return (
    <PressScale onPress={onPress}>
      <View className="flex-row items-center py-3.5 px-4 bg-surface dark:bg-surface-dark rounded-2xl mb-2.5 border border-line/60 dark:border-line-dark/60 shadow-sm">
        {/* Category / Status Icon */}
        <Pressable
          onPress={onCategorizePress ?? onPress}
          className="relative mr-3.5"
        >
          <View
            style={{ backgroundColor: `${categoryColor}18` }}
            className="w-12 h-12 rounded-2xl items-center justify-center border border-black/5 dark:border-white/5"
          >
            <CategoryIcon
              icon={isPending ? 'more-horizontal' : categoryIcon}
              size={22}
              color={categoryColor}
            />
          </View>
          {transaction.source === 'sms' && (
            <View className="absolute -bottom-1 -right-1 bg-accent rounded-full w-4 h-4 items-center justify-center border-2 border-surface dark:border-surface-dark">
              <MessageSquare size={8} color="#FFFFFF" />
            </View>
          )}
        </Pressable>

        {/* Details */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <Text
              className="text-base font-semibold text-ink dark:text-ink-dark flex-1"
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          <View className="flex-row items-center mt-1 flex-wrap gap-1.5">
            <Text className="text-xs text-muted dark:text-muted-dark">
              {formatRelativeDate(transaction.transactionDate)} • {formatTime(transaction.transactionDate)}
            </Text>
            {transaction.accountAlias && (
              <View className="bg-bg dark:bg-bg-dark px-1.5 py-0.5 rounded">
                <Text className="text-[10px] font-semibold text-muted dark:text-muted-dark uppercase">
                  {transaction.accountAlias}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount & Category Pill */}
        <View className="items-end">
          <Text
            className={`text-base font-bold ${
              isIncome
                ? 'text-positive dark:text-positive'
                : 'text-ink dark:text-ink-dark'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatPaise(transaction.amountMinor)}
          </Text>

          <Pressable
            onPress={onCategorizePress}
            hitSlop={8}
            className="mt-1"
          >
            <CategoryBadge
              name={categoryName}
              icon={categoryIcon}
              color={categoryColor}
              isPending={isPending}
              size="sm"
            />
          </Pressable>
        </View>
      </View>
    </PressScale>
  );
}
