import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { formatPaise } from '../../utils/currency';
import type { DailySpending } from '../../types/transaction.types';

interface DailySpendingBarChartProps {
  data: DailySpending[];
}

export function DailySpendingBarChart({ data }: DailySpendingBarChartProps) {
  const [selectedDay, setSelectedDay] = useState<DailySpending | null>(null);

  if (data.length === 0) {
    return (
      <View className="py-6 items-center justify-center">
        <Text className="text-xs text-muted dark:text-muted-dark">
          No daily spending data recorded yet
        </Text>
      </View>
    );
  }

  const maxSpend = Math.max(...data.map((d) => d.totalMinor), 1);

  return (
    <View className="w-full">
      {/* Selected day tooltip */}
      {selectedDay ? (
        <View className="flex-row items-center justify-between bg-bg dark:bg-bg-dark px-3 py-1.5 rounded-xl mb-3 border border-line dark:border-line-dark">
          <Text className="text-xs text-muted dark:text-muted-dark">
            {new Date(selectedDay.date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              weekday: 'short',
            })}
          </Text>
          <Text className="text-xs font-bold text-accent">
            {formatPaise(selectedDay.totalMinor)} ({selectedDay.count} txn)
          </Text>
        </View>
      ) : (
        <Text className="text-[11px] text-muted dark:text-muted-dark mb-3">
          Tap a bar to see daily breakdown
        </Text>
      )}

      {/* Bar Chart scroll container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'flex-end', paddingVertical: 8, minWidth: '100%' }}
      >
        <View className="flex-row items-end gap-x-2 h-36 px-1">
          {data.map((d) => {
            const heightPercent = Math.max(6, Math.round((d.totalMinor / maxSpend) * 100));
            const isSelected = selectedDay?.date === d.date;
            const dateObj = new Date(d.date);
            const dayNum = dateObj.getDate();

            return (
              <Pressable
                key={d.date}
                onPress={() => setSelectedDay(d)}
                className="items-center"
              >
                <View className="h-28 justify-end items-center w-7">
                  <View
                    style={{
                      height: `${heightPercent}%`,
                    }}
                    className={`w-4 rounded-t-md transition-all ${
                      isSelected
                        ? 'bg-accent shadow-md'
                        : 'bg-accent/35 dark:bg-accent/40'
                    }`}
                  />
                </View>
                <Text
                  className={`text-[10px] mt-1 font-semibold ${
                    isSelected
                      ? 'text-accent font-bold'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  {dayNum}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
