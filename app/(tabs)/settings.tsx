import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import {
  Shield,
  Database,
  Tag,
  Trash2,
  Download,
  Plus,
  CheckCircle2,
  Sparkles,
  Info,
  Radio,
  FileSpreadsheet,
  ChevronRight,
  X,
} from 'lucide-react-native';
import {
  getAllMerchantRules,
  insertMerchantRule,
  deleteMerchantRule,
  toggleMerchantRule,
} from '../../src/database/repositories/merchantRuleRepository';
import { getAllCategories } from '../../src/database/repositories/categoryRepository';
import {
  deleteAllTransactions,
  getTransactions,
} from '../../src/database/repositories/transactionRepository';
import { seedDemoData, clearDemoData } from '../../src/features/demo/seedDemoData';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { dataChanged } from '../../src/store/slices/appSlice';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Card } from '../../src/components/ui/Card';
import { CategoryIcon } from '../../src/components/ui/CategoryIcon';
import { PressScale } from '../../src/components/animations/PressScale';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import type { MerchantRule } from '../../src/types/budget.types';
import type { Category } from '../../src/types/category.types';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const dataVersion = useAppSelector((s) => s.app.dataVersion);

  const [rules, setRules] = useState<MerchantRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);

  // New Rule Modal
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [pattern, setPattern] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('food');

  useEffect(() => {
    void loadSettings();
  }, [dataVersion]);

  async function loadSettings() {
    const [r, c] = await Promise.all([
      getAllMerchantRules(),
      getAllCategories(),
    ]);
    setRules(r);
    setCategories(c);
  }

  async function handleCreateRule() {
    if (!pattern.trim()) return;
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await insertMerchantRule({
      id: ruleId,
      merchantPattern: pattern.trim(),
      normalizedMerchant: pattern.trim().toLowerCase(),
      categoryId: selectedCatId,
      matchType: 'contains',
      isEnabled: true,
    });
    setPattern('');
    setRuleModalVisible(false);
    dispatch(dataChanged());
  }

  async function handleDeleteRule(id: string) {
    await deleteMerchantRule(id);
    dispatch(dataChanged());
  }

  async function handleLoadDemoData() {
    const count = await seedDemoData();
    dispatch(dataChanged());
    Alert.alert('Demo Data', count > 0 ? `Loaded ${count} sample transactions.` : 'Demo data is already loaded.');
  }

  async function handleClearDemoData() {
    await clearDemoData();
    dispatch(dataChanged());
    Alert.alert('Demo Data Cleared', 'All sample demo transactions have been removed.');
  }

  function handleWipeAllData() {
    Alert.alert(
      'Wipe All Transactions',
      'Are you sure you want to permanently delete ALL recorded transactions? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            await deleteAllTransactions();
            dispatch(dataChanged());
            Alert.alert('Database Cleared', 'All transactions have been deleted.');
          },
        },
      ],
    );
  }

  async function handleExportJson() {
    const all = await getTransactions({});
    const json = JSON.stringify(all, null, 2);
    try {
      await Share.share({
        message: json,
        title: 'spendly_backup.json',
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="mt-2 mb-4">
          <Text className="text-2xl font-extrabold text-ink dark:text-ink-dark">
            Settings & Privacy
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            Manage permissions, auto-rules, and local data
          </Text>
        </View>

        {/* Privacy & Offline Guarantee Card */}
        <SlideUpReveal index={0}>
          <Card className="mb-4 bg-accent/10 dark:bg-accent/15 p-5 rounded-3xl border border-accent/30 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Shield size={22} color="#6F7F52" />
              <Text className="text-base font-bold text-ink dark:text-ink-dark ml-2.5">
                100% Offline & Private
              </Text>
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark leading-5">
              Spendly requires no account, no internet access, and no cloud servers. All bank SMS parsing and transaction records remain strictly stored on this device in SQLite.
            </Text>
          </Card>
        </SlideUpReveal>

        {/* SMS Receiver Status */}
        <SlideUpReveal index={1}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <Radio size={20} color="#6F7F52" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-ink dark:text-ink-dark">
                    Automatic Bank SMS Detection
                  </Text>
                  <Text className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                    Process incoming bank alerts in background
                  </Text>
                </View>
              </View>
              <Switch
                value={autoSmsEnabled}
                onValueChange={setAutoSmsEnabled}
                trackColor={{ false: '#737970', true: '#6F7F52' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </SlideUpReveal>

        {/* Auto-Categorization Rules */}
        <SlideUpReveal index={2}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-ink dark:text-ink-dark">
                  Merchant Auto-Rules
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark">
                  Automatically categorize SMS containing keywords
                </Text>
              </View>
              <PressScale onPress={() => setRuleModalVisible(true)}>
                <View className="bg-accent/15 px-3 py-1.5 rounded-xl flex-row items-center">
                  <Plus size={14} color="#6F7F52" />
                  <Text className="text-xs font-bold text-accent ml-1">
                    Add Rule
                  </Text>
                </View>
              </PressScale>
            </View>

            {rules.length === 0 ? (
              <Text className="text-xs text-muted dark:text-muted-dark py-2">
                No merchant rules configured yet. When you categorize a transaction, you can toggle &ldquo;Always auto-categorize&rdquo; or add rules here.
              </Text>
            ) : (
              <View className="gap-y-2 mt-2">
                {rules.map((rule) => {
                  const cat = categories.find((c) => c.id === rule.categoryId);
                  return (
                    <View
                      key={rule.id}
                      className="flex-row items-center justify-between p-3 rounded-2xl bg-bg dark:bg-bg-dark border border-line/60 dark:border-line-dark/60"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-7 h-7 rounded-lg bg-surface dark:bg-surface-dark items-center justify-center mr-2.5">
                          <CategoryIcon
                            icon={cat?.icon || 'tag'}
                            size={14}
                            color={cat?.colorToken || '#6F7F52'}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-xs font-bold text-ink dark:text-ink-dark"
                            numberOfLines={1}
                          >
                            &ldquo;{rule.merchantPattern}&rdquo;
                          </Text>
                          <Text className="text-[10px] text-muted dark:text-muted-dark">
                            Maps to {cat?.name || rule.categoryId}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleDeleteRule(rule.id)}
                        hitSlop={8}
                        className="p-1.5"
                      >
                        <Trash2 size={15} color="#CF625C" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </SlideUpReveal>

        {/* Data & Backup Management */}
        <SlideUpReveal index={3}>
          <Card className="mb-4 bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-line/80 dark:border-line-dark shadow-sm">
            <Text className="text-base font-bold text-ink dark:text-ink-dark mb-3">
              Data & Testing
            </Text>

            <View className="gap-y-2.5">
              {/* Load Demo */}
              <PressScale onPress={handleLoadDemoData}>
                <View className="p-3.5 rounded-2xl bg-bg dark:bg-bg-dark border border-line dark:border-line-dark flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Sparkles size={18} color="#6F7F52" />
                    <Text className="text-xs font-bold text-ink dark:text-ink-dark ml-2.5">
                      Load Sample Demo Transactions
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#737970" />
                </View>
              </PressScale>

              {/* Clear Demo */}
              <PressScale onPress={handleClearDemoData}>
                <View className="p-3.5 rounded-2xl bg-bg dark:bg-bg-dark border border-line dark:border-line-dark flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Database size={18} color="#737970" />
                    <Text className="text-xs font-bold text-ink dark:text-ink-dark ml-2.5">
                      Clear Demo Data Only
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#737970" />
                </View>
              </PressScale>

              {/* Export JSON */}
              <PressScale onPress={handleExportJson}>
                <View className="p-3.5 rounded-2xl bg-bg dark:bg-bg-dark border border-line dark:border-line-dark flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Download size={18} color="#6F7F52" />
                    <Text className="text-xs font-bold text-ink dark:text-ink-dark ml-2.5">
                      Export Full Database (JSON Backup)
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#737970" />
                </View>
              </PressScale>

              {/* Wipe all */}
              <PressScale onPress={handleWipeAllData}>
                <View className="p-3.5 rounded-2xl bg-danger/10 border border-danger/25 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Trash2 size={18} color="#CF625C" />
                    <Text className="text-xs font-bold text-danger ml-2.5">
                      Delete All Transactions
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#CF625C" />
                </View>
              </PressScale>
            </View>
          </Card>
        </SlideUpReveal>

        {/* App Info Footer */}
        <View className="items-center py-4">
          <Text className="text-xs font-bold text-ink dark:text-ink-dark">
            Spendly v1.0.0
          </Text>
          <Text className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
            Android-First Offline Personal Expense Tracker
          </Text>
        </View>
      </ScrollView>

      {/* Add Rule Modal */}
      <Modal
        visible={ruleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRuleModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-6 border-t border-line dark:border-line-dark shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-line dark:border-line-dark mb-4">
              <Text className="text-lg font-bold text-ink dark:text-ink-dark">
                New Auto-Categorization Rule
              </Text>
              <Pressable
                onPress={() => setRuleModalVisible(false)}
                hitSlop={8}
              >
                <X size={18} color="#737970" />
              </Pressable>
            </View>

            <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
              Merchant Name / Keyword
            </Text>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="e.g. Swiggy, Netflix, Uber, DMart..."
              placeholderTextColor="#737970"
              className="bg-bg dark:bg-bg-dark rounded-2xl px-4 py-3 text-sm text-ink dark:text-ink-dark border border-line dark:border-line-dark font-medium mb-4"
            />

            <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
              Assign to Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-6"
            >
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCatId(cat.id)}
                  className={`flex-row items-center px-3.5 py-2.5 rounded-2xl mr-2.5 border ${
                    selectedCatId === cat.id
                      ? 'border-accent bg-accent/15'
                      : 'border-line dark:border-line-dark bg-bg dark:bg-bg-dark'
                  }`}
                >
                  <CategoryIcon
                    icon={cat.icon}
                    size={16}
                    color={selectedCatId === cat.id ? '#6F7F52' : cat.colorToken}
                  />
                  <Text
                    className={`text-xs font-semibold ml-2 ${
                      selectedCatId === cat.id
                        ? 'text-accent'
                        : 'text-ink dark:text-ink-dark'
                    }`}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <PressScale onPress={handleCreateRule}>
              <View className="bg-accent py-3.5 rounded-2xl items-center justify-center shadow">
                <Text className="text-sm font-bold text-white">Save Rule</Text>
              </View>
            </PressScale>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
