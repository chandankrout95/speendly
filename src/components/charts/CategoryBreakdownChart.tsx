import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { formatPaise } from '../../utils/currency';
import { CategoryIcon } from '../ui/CategoryIcon';
import type { CategorySpending } from '../../types/transaction.types';

interface CategoryBreakdownChartProps {
  categories: CategorySpending[];
  onCategoryPress?: (categoryId: string) => void;
}

export function CategoryBreakdownChart({
  categories,
  onCategoryPress,
}: CategoryBreakdownChartProps) {
  if (categories.length === 0) {
    return (
      <View className="py-6 items-center justify-center">
        <Text className="text-xs text-muted dark:text-muted-dark">
          No categorized expenses in this period
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-y-4">
      {/* Multi-segment Progress Bar */}
      <View className="h-3 w-full rounded-full bg-bg dark:bg-bg-dark flex-row overflow-hidden border border-line/40 dark:border-line-dark/40">
        {categories.map((cat) => {
          if (cat.percentage <= 0) return null;
          return (
            <View
              key={cat.categoryId}
              style={{
                width: `${Math.max(2, cat.percentage)}%`,
                backgroundColor: cat.categoryColor || '#95A5A6',
              }}
              className="h-full"
            />
          );
        })}
      </View>

      {/* Category Rows */}
      <View className="gap-y-3">
        {categories.map((cat) => (
          <Pressable
            key={cat.categoryId}
            onPress={() => onCategoryPress?.(cat.categoryId)}
            className="flex-row items-center justify-between py-1"
          >
            {/* Icon & Name */}
            <View className="flex-row items-center flex-1 mr-3">
              <View
                style={{ backgroundColor: `${cat.categoryColor || '#95A5A6'}22` }}
                className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
              >
                <CategoryIcon
                  icon={cat.categoryIcon || 'more-horizontal'}
                  size={16}
                  color={cat.categoryColor || '#95A5A6'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold text-ink dark:text-ink-dark"
                  numberOfLines={1}
                >
                  {cat.categoryName}
                </Text>
                <Text className="text-[10px] text-muted dark:text-muted-dark">
                  {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
            </View>

            {/* Percentage & Amount */}
            <View className="items-end">
              <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                {formatPaise(cat.totalMinor)}
              </Text>
              <Text
                style={{ color: cat.categoryColor || '#737970' }}
                className="text-[11px] font-semibold"
              >
                {cat.percentage}%
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
