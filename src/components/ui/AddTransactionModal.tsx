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
import { X, Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';
import { insertTransaction } from '../../database/repositories/transactionRepository';
import { getAllCategories } from '../../database/repositories/categoryRepository';
import { parseRupeesToPaise } from '../../utils/currency';
import { useAppDispatch } from '../../store/hooks';
import { dataChanged } from '../../store/slices/appSlice';
import { CategoryIcon } from './CategoryIcon';
import type { Category } from '../../types/category.types';
import {
  TransactionType,
  CategorizationStatus,
  TransactionSource,
  type TransactionInsert,
} from '../../types/transaction.types';
import { PressScale } from '../animations/PressScale';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('food');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      void getAllCategories().then(setCategories);
      setAmount('');
      setMerchant('');
      setNotes('');
      setType(TransactionType.EXPENSE);
      setSelectedCategoryId('food');
      setError(null);
    }
  }, [visible]);

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    if (newType === TransactionType.TRANSFER) {
      setSelectedCategoryId('transfers');
    } else if (newType === TransactionType.INCOME) {
      setSelectedCategoryId(null);
    } else if (selectedCategoryId === 'transfers') {
      setSelectedCategoryId('food');
    }
  }

  async function handleSave() {
    setError(null);

    const amountMinor = parseRupeesToPaise(amount);
    if (!amountMinor || amountMinor <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const now = new Date().toISOString();
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const txn: TransactionInsert = {
      id,
      amountMinor,
      currency: 'INR',
      transactionType: type,
      categoryId: selectedCategoryId,
      merchantName: merchant.trim() || null,
      transactionReference: null,
      transactionDate: now,
      receivedAt: now,
      source: TransactionSource.MANUAL,
      categorizationStatus: selectedCategoryId
        ? CategorizationStatus.MANUAL
        : CategorizationStatus.PENDING,
      confidence: 1.0,
      fingerprint: `manual_fp_${id}`,
      notes: notes.trim() || null,
    };

    try {
      await insertTransaction(txn);
      dispatch(dataChanged());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
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
            <Text className="text-xl font-bold text-ink dark:text-ink-dark">
              Add Transaction
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
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Type Selector (Expense / Income / Transfer) */}
            <View className="flex-row bg-bg dark:bg-bg-dark p-1 rounded-2xl mb-4 border border-line dark:border-line-dark">
              <Pressable
                onPress={() => handleTypeChange(TransactionType.EXPENSE)}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                  type === TransactionType.EXPENSE
                    ? 'bg-surface dark:bg-surface-dark shadow-sm'
                    : ''
                }`}
              >
                <ArrowDownLeft
                  size={16}
                  color={type === TransactionType.EXPENSE ? '#CF625C' : '#737970'}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    type === TransactionType.EXPENSE
                      ? 'text-ink dark:text-ink-dark'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  Expense
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange(TransactionType.INCOME)}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                  type === TransactionType.INCOME
                    ? 'bg-surface dark:bg-surface-dark shadow-sm'
                    : ''
                }`}
              >
                <ArrowUpRight
                  size={16}
                  color={type === TransactionType.INCOME ? '#3D8B68' : '#737970'}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    type === TransactionType.INCOME
                      ? 'text-ink dark:text-ink-dark'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  Income
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange(TransactionType.TRANSFER)}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                  type === TransactionType.TRANSFER
                    ? 'bg-surface dark:bg-surface-dark shadow-sm'
                    : ''
                }`}
              >
                <ArrowLeftRight
                  size={16}
                  color={type === TransactionType.TRANSFER ? '#6F7F52' : '#737970'}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    type === TransactionType.TRANSFER
                      ? 'text-ink dark:text-ink-dark'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  Transfer
                </Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Amount (₹)
              </Text>
              <View className="flex-row items-center bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3 border border-line dark:border-line-dark">
                <Text className="text-2xl font-bold text-ink dark:text-ink-dark mr-2">
                  ₹
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#737970"
                  keyboardType="decimal-pad"
                  className="flex-1 text-2xl font-bold text-ink dark:text-ink-dark"
                />
              </View>
            </View>

            {/* Merchant / Description */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Merchant / Description
              </Text>
              <TextInput
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Swiggy, Starbucks, DMart..."
                placeholderTextColor="#737970"
                className="bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3.5 text-base text-ink dark:text-ink-dark border border-line dark:border-line-dark font-medium"
              />
            </View>

            {/* Category Selector */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row py-1"
              >
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

            {/* Notes */}
            <View className="mb-5">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
                Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any extra details..."
                placeholderTextColor="#737970"
                className="bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3 text-sm text-ink dark:text-ink-dark border border-line dark:border-line-dark font-normal"
              />
            </View>

            {/* Error message */}
            {error && (
              <View className="p-3 rounded-xl bg-danger/10 border border-danger/20 mb-4">
                <Text className="text-xs text-danger font-medium">{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <PressScale onPress={handleSave}>
              <View className="bg-accent py-4 rounded-2xl items-center justify-center flex-row shadow-md">
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-base font-bold text-white ml-2">
                  Save Transaction
                </Text>
              </View>
            </PressScale>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
