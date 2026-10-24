import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import {
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  TrendingUp,
} from 'lucide-react-native';
import {
  getAllBudgets,
  getBudgetProgress,
  deleteBudget,
} from '../../src/database/repositories/budgetRepository';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { dataChanged } from '../../src/store/slices/appSlice';
import { formatPaise } from '../../src/utils/currency';
import { getMonthStart, getMonthEnd } from '../../src/utils/dates';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Card } from '../../src/components/ui/Card';
import { CategoryIcon } from '../../src/components/ui/CategoryIcon';
import { BudgetModal } from '../../src/components/ui/BudgetModal';
import { PressScale } from '../../src/components/animations/PressScale';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import type { Budget, BudgetProgress } from '../../src/types/budget.types';

export default function BudgetsScreen() {
  const dispatch = useAppDispatch();
  const dataVersion = useAppSelector((s) => s.app.dataVersion);

  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    void loadBudgets();
  }, [dataVersion]);

  async function loadBudgets() {
    setIsLoading(true);
    try {
      const now = new Date();
      const start = getMonthStart(now);
      const end = getMonthEnd(now);
      const progress = await getBudgetProgress(start, end);
      setBudgets(progress);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(b: Budget) {
    setEditingBudget(b);
    setModalVisible(true);
  }

  function handleDelete(b: Budget) {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget "${b.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBudget(b.id);
            dispatch(dataChanged());
          },
        },
      ],
    );
  }

  const overallBudget = budgets.find((b) => !b.budget.categoryId);
  const categoryBudgets = budgets.filter((b) => b.budget.categoryId);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadBudgets}
            tintColor="#6F7F52"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <View>
            <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">
              Budgets & Limits
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              Set spending goals and stay within limits
            </Text>
          </View>

          <PressScale
            onPress={() => {
              setEditingBudget(null);
              setModalVisible(true);
            }}
          >
            <View className="w-10 h-10 rounded-2xl bg-accent items-center justify-center shadow-md">
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </PressScale>
        </View>

        {/* Overall Monthly Budget Hero */}
        {overallBudget ? (
          <SlideUpReveal index={0}>
            <Card className="mb-5 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Wallet size={18} color="#6F7F52" className="mr-2" />
                  <Text className="text-sm font-bold text-ink dark:text-ink-dark ml-1.5">
                    {overallBudget.budget.name}
                  </Text>
                </View>

                <View className="flex-row items-center gap-x-1">
                  <Pressable
                    onPress={() => handleEdit(overallBudget.budget)}
                    hitSlop={8}
                    className="p-1.5 rounded-lg bg-bg dark:bg-bg-dark"
                  >
                    <Edit2 size={14} color="#737970" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(overallBudget.budget)}
                    hitSlop={8}
                    className="p-1.5 rounded-lg bg-bg dark:bg-bg-dark"
                  >
                    <Trash2 size={14} color="#CF625C" />
                  </Pressable>
                </View>
              </View>

              {/* Amount Display */}
              <View className="my-2">
                <Text className="text-3xl font-extrabold text-ink dark:text-ink-dark">
                  {formatPaise(overallBudget.spentMinor)}
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
                  spent of {formatPaise(overallBudget.budget.amountMinor)} limit
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="mt-3">
                <View className="h-3 w-full rounded-full bg-bg dark:bg-bg-dark overflow-hidden mb-2">
                  <View
                    style={{
                      width: `${Math.min(100, overallBudget.percentage)}%`,
                    }}
                    className={`h-full rounded-full ${
                      overallBudget.isExceeded
                        ? 'bg-danger'
                        : overallBudget.isApproaching
                        ? 'bg-warning'
                        : 'bg-accent'
                    }`}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <Text
                    className={`text-xs font-bold ${
                      overallBudget.isExceeded
                        ? 'text-danger'
                        : overallBudget.isApproaching
                        ? 'text-warning'
                        : 'text-accent'
                    }`}
                  >
                    {overallBudget.percentage}% used
                  </Text>
                  <Text className="text-xs font-semibold text-ink dark:text-ink-dark">
                    {overallBudget.isExceeded
                      ? `${formatPaise((overallBudget.spentMinor - overallBudget.budget.amountMinor) as any)} over budget`
                      : `${formatPaise(overallBudget.remainingMinor)} remaining`}
                  </Text>
                </View>
              </View>
            </Card>
          </SlideUpReveal>
        ) : (
          <SlideUpReveal index={0}>
            <View className="p-5 bg-surface dark:bg-surface-dark rounded-3xl border border-line dark:border-line-dark mb-5 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Wallet size={20} color="#6F7F52" />
                <Text className="text-base font-bold text-ink dark:text-ink-dark ml-2">
                  No Monthly Budget Set
                </Text>
              </View>
              <Text className="text-xs text-muted dark:text-muted-dark mb-4 leading-4">
                Set an overall monthly target limit to stay on top of your financial discipline.
              </Text>
              <PressScale
                onPress={() => {
                  setEditingBudget(null);
                  setModalVisible(true);
                }}
              >
                <View className="bg-accent/15 py-2.5 px-4 rounded-xl flex-row items-center justify-center">
                  <Plus size={16} color="#6F7F52" />
                  <Text className="text-xs font-bold text-accent ml-1.5">
                    Set Monthly Limit
                  </Text>
                </View>
              </PressScale>
            </View>
          </SlideUpReveal>
        )}

        {/* Category Specific Budgets */}
        <View className="mb-4">
          <Text className="text-base font-bold text-ink dark:text-ink-dark mb-3 px-1">
            Category Budgets
          </Text>

          {categoryBudgets.length === 0 ? (
            <View className="py-8 items-center justify-center bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">
                No category budgets configured yet
              </Text>
              <Pressable
                onPress={() => {
                  setEditingBudget(null);
                  setModalVisible(true);
                }}
                className="mt-2"
              >
                <Text className="text-xs font-bold text-accent">
                  + Add Category Budget (e.g. Food, Shopping)
                </Text>
              </Pressable>
            </View>
          ) : (
            categoryBudgets.map((bp) => (
              <Card
                key={bp.budget.id}
                className="mb-3 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-line/80 dark:border-line-dark shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-8 h-8 rounded-xl bg-bg dark:bg-bg-dark items-center justify-center mr-2.5">
                      <CategoryIcon
                        icon={bp.budget.categoryId || 'wallet'}
                        size={16}
                        color="#6F7F52"
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-bold text-ink dark:text-ink-dark"
                        numberOfLines={1}
                      >
                        {bp.budget.name}
                      </Text>
                      <Text className="text-[11px] text-muted dark:text-muted-dark">
                        {bp.categoryName || 'Category'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-x-1">
                    <Pressable
                      onPress={() => handleEdit(bp.budget)}
                      hitSlop={8}
                      className="p-1.5 rounded-lg bg-bg dark:bg-bg-dark"
                    >
                      <Edit2 size={13} color="#737970" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(bp.budget)}
                      hitSlop={8}
                      className="p-1.5 rounded-lg bg-bg dark:bg-bg-dark"
                    >
                      <Trash2 size={13} color="#CF625C" />
                    </Pressable>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="h-2 w-full rounded-full bg-bg dark:bg-bg-dark overflow-hidden my-2">
                  <View
                    style={{
                      width: `${Math.min(100, bp.percentage)}%`,
                    }}
                    className={`h-full rounded-full ${
                      bp.isExceeded
                        ? 'bg-danger'
                        : bp.isApproaching
                        ? 'bg-warning'
                        : 'bg-accent'
                    }`}
                  />
                </View>

                <View className="flex-row justify-between items-center text-xs">
                  <Text className="text-xs text-muted dark:text-muted-dark">
                    <Text className="font-bold text-ink dark:text-ink-dark">
                      {formatPaise(bp.spentMinor)}
                    </Text>{' '}
                    / {formatPaise(bp.budget.amountMinor)}
                  </Text>
                  <Text
                    className={`text-xs font-bold ${
                      bp.isExceeded
                        ? 'text-danger'
                        : bp.isApproaching
                        ? 'text-warning'
                        : 'text-accent'
                    }`}
                  >
                    {bp.percentage}%
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        budgetToEdit={editingBudget}
      />
    </ScreenContainer>
  );
}
