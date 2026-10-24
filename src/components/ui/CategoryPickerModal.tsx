import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Check, BookmarkCheck } from 'lucide-react-native';
import { getAllCategories } from '../../database/repositories/categoryRepository';
import { insertMerchantRule } from '../../database/repositories/merchantRuleRepository';
import { updateTransactionCategory } from '../../database/repositories/transactionRepository';
import { useAppDispatch } from '../../store/hooks';
import { dataChanged } from '../../store/slices/appSlice';
import { CategoryIcon } from './CategoryIcon';
import type { Category } from '../../types/category.types';
import { PressScale } from '../animations/PressScale';

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId: string | null;
  currentCategoryId?: string | null;
  merchantName?: string | null;
  onCategorySelected?: (categoryId: string) => void;
}

export function CategoryPickerModal({
  visible,
  onClose,
  transactionId,
  currentCategoryId,
  merchantName,
  onCategorySelected,
}: CategoryPickerModalProps) {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rememberRule, setRememberRule] = useState<boolean>(true);

  useEffect(() => {
    if (visible) {
      void loadCategories();
    }
  }, [visible]);

  async function loadCategories() {
    const cats = await getAllCategories();
    setCategories(cats);
  }

  async function handleSelectCategory(catId: string) {
    try {
      if (transactionId) {
        await updateTransactionCategory(transactionId, catId, 'manual');

        // If user wants to remember merchant rule
        if (rememberRule && merchantName && merchantName.trim().length > 0) {
          const ruleId = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await insertMerchantRule({
            id: ruleId,
            merchantPattern: merchantName.trim(),
            normalizedMerchant: merchantName.trim().toLowerCase(),
            categoryId: catId,
            matchType: 'contains',
            isEnabled: true,
          });
        }

        dispatch(dataChanged());
      }

      if (onCategorySelected) {
        onCategorySelected(catId);
      }

      onClose();
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[85%] border-t border-line dark:border-line-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-3 border-b border-line/60 dark:border-line-dark/60">
            <View>
              <Text className="text-xl font-bold text-ink dark:text-ink-dark">
                Choose Category
              </Text>
              {merchantName ? (
                <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
                  for <Text className="font-semibold text-ink dark:text-ink-dark">{merchantName}</Text>
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-bg dark:bg-bg-dark items-center justify-center"
            >
              <X size={18} color="#737970" />
            </Pressable>
          </View>

          {/* Remember rule toggle if merchant name exists */}
          {merchantName && merchantName.trim().length > 0 && (
            <View className="mx-6 mt-4 p-3.5 rounded-2xl bg-accent/10 dark:bg-accent/15 flex-row items-center justify-between border border-accent/20">
              <View className="flex-row items-center flex-1 mr-3">
                <BookmarkCheck size={20} color="#6F7F52" className="mr-2" />
                <View className="flex-1 ml-2">
                  <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                    Auto-categorize future SMS
                  </Text>
                  <Text className="text-[11px] text-muted dark:text-muted-dark">
                    Always use this category for &ldquo;{merchantName}&rdquo;
                  </Text>
                </View>
              </View>
              <Switch
                value={rememberRule}
                onValueChange={setRememberRule}
                trackColor={{ false: '#737970', true: '#6F7F52' }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}

          {/* Category Grid / List */}
          <ScrollView
            className="px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {categories.map((cat) => {
                const isSelected = currentCategoryId === cat.id;
                return (
                  <PressScale
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat.id)}
                    style={{ width: '48%' }}
                  >
                    <View
                      style={{
                        borderColor: isSelected ? cat.colorToken : 'transparent',
                        borderWidth: isSelected ? 2 : 1,
                      }}
                      className={`p-3.5 rounded-2xl flex-row items-center bg-bg dark:bg-bg-dark ${
                        !isSelected ? 'border-line dark:border-line-dark' : ''
                      }`}
                    >
                      <View
                        style={{ backgroundColor: `${cat.colorToken}22` }}
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      >
                        <CategoryIcon icon={cat.icon} size={20} color={cat.colorToken} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-semibold text-sm text-ink dark:text-ink-dark"
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={{ backgroundColor: cat.colorToken }}
                          className="w-5 h-5 rounded-full items-center justify-center ml-1"
                        >
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </PressScale>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
