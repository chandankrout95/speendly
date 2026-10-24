import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Wallet } from 'lucide-react-native';
import { insertBudget, updateBudget } from '../../database/repositories/budgetRepository';
import { getAllCategories } from '../../database/repositories/categoryRepository';
import { parseRupeesToPaise, formatPaise } from '../../utils/currency';
import { getMonthStart } from '../../utils/dates';
import { useAppDispatch } from '../../store/hooks';
import { dataChanged } from '../../store/slices/appSlice';
import { CategoryIcon } from './CategoryIcon';
import type { Category } from '../../types/category.types';
import type { Budget, BudgetInsert } from '../../types/budget.types';
import { PressScale } from '../animations/PressScale';

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export function BudgetModal({ visible, onClose, budgetToEdit }: BudgetModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      void getAllCategories().then(setCategories);
      if (budgetToEdit) {
        setName(budgetToEdit.name);
        setAmount((budgetToEdit.amountMinor / 100).toString());
        setPeriod(budgetToEdit.period);
        setSelectedCategoryId(budgetToEdit.categoryId);
      } else {
        setName('');
        setAmount('');
        setPeriod('monthly');
        setSelectedCategoryId(null);
      }
      setError(null);
    }
  }, [visible, budgetToEdit]);

  async function handleSave() {
    setError(null);

    const amountMinor = parseRupeesToPaise(amount);
    if (!amountMinor || amountMinor <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    const budgetName = name.trim() || (selectedCategoryId ? 'Category Budget' : 'Monthly Overall Budget');

    try {
      if (budgetToEdit) {
        await updateBudget(budgetToEdit.id, {
          name: budgetName,
          amountMinor,
          period,
          categoryId: selectedCategoryId,
        });
      } else {
        const id = `bgt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newBudget: BudgetInsert = {
          id,
          name: budgetName,
          amountMinor,
          currency: 'INR',
          period,
          categoryId: selectedCategoryId,
          startDate: getMonthStart(),
          isActive: true,
        };
        await insertBudget(newBudget);
      }

      dispatch(dataChanged());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[90%] border-t border-line dark:border-line-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-3 border-b border-line/60 dark:border-line-dark/60">
            <View className="flex-row items-center">
              <Wallet size={20} color="#6F7F52" className="mr-2" />
              <Text className="text-xl font-bold text-ink dark:text-ink-dark ml-2">
                {budgetToEdit ? 'Edit Budget' : 'Create Budget'}
              </Text>
            </View>
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
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Limit Amount */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Target Limit (₹)
              </Text>
              <View className="flex-row items-center bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3 border border-line dark:border-line-dark">
                <Text className="text-2xl font-bold text-ink dark:text-ink-dark mr-2">
                  ₹
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="25,000"
                  placeholderTextColor="#737970"
                  keyboardType="decimal-pad"
                  className="flex-1 text-2xl font-bold text-ink dark:text-ink-dark"
                />
              </View>
            </View>

            {/* Budget Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Budget Label
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Total Monthly Budget, Food Allowance..."
                placeholderTextColor="#737970"
                className="bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3.5 text-base text-ink dark:text-ink-dark border border-line dark:border-line-dark font-medium"
              />
            </View>

            {/* Period */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Budget Period
              </Text>
              <View className="flex-row bg-bg dark:bg-bg-dark p-1 rounded-2xl border border-line dark:border-line-dark">
                <Pressable
                  onPress={() => setPeriod('monthly')}
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    period === 'monthly'
                      ? 'bg-surface dark:bg-surface-dark shadow-sm'
                      : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      period === 'monthly'
                        ? 'text-accent'
                        : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    Monthly
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPeriod('weekly')}
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    period === 'weekly'
                      ? 'bg-surface dark:bg-surface-dark shadow-sm'
                      : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      period === 'weekly'
                        ? 'text-accent'
                        : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    Weekly
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Category Scope */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Applies To
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row py-1"
              >
                {/* Overall Option */}
                <Pressable
                  onPress={() => setSelectedCategoryId(null)}
                  className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2.5 border ${
                    selectedCategoryId === null
                      ? 'border-accent bg-accent/15'
                      : 'border-line dark:border-line-dark bg-bg dark:bg-bg-dark'
                  }`}
                >
                  <Wallet
                    size={16}
                    color={selectedCategoryId === null ? '#6F7F52' : '#737970'}
                  />
                  <Text
                    className={`text-xs font-semibold ml-2 ${
                      selectedCategoryId === null
                        ? 'text-accent'
                        : 'text-ink dark:text-ink-dark'
                    }`}
                  >
                    Overall (All Spending)
                  </Text>
                </Pressable>

                {/* Categories */}
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      className={`flex-row items-center px-3.5 py-2.5 rounded-2xl mr-2.5 border ${
                        isSelected
                          ? 'border-accent bg-accent/15'
                          : 'border-line dark:border-line-dark bg-bg dark:bg-bg-dark'
                      }`}
                    >
                      <CategoryIcon
                        icon={cat.icon}
                        size={16}
                        color={isSelected ? '#6F7F52' : cat.colorToken}
                      />
                      <Text
                        className={`text-xs font-semibold ml-2 ${
                          isSelected
                            ? 'text-accent'
                            : 'text-ink dark:text-ink-dark'
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Error message */}
            {error && (
              <View className="p-3 rounded-xl bg-danger/10 border border-danger/20 mb-4">
                <Text className="text-xs text-danger font-medium">{error}</Text>
              </View>
            )}

            {/* Save button */}
            <PressScale onPress={handleSave}>
              <View className="bg-accent py-4 rounded-2xl items-center justify-center flex-row shadow-md">
                <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-base font-bold text-white ml-2">
                  {budgetToEdit ? 'Update Budget' : 'Save Budget'}
                </Text>
              </View>
            </PressScale>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
