import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View, ScrollView } from 'react-native';
import {
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle2,
  Database,
} from 'lucide-react-native';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SlideUpReveal } from '../../src/components/animations/SlideUpReveal';
import { useAppDispatch } from '../../src/store/hooks';
import { setOnboardingComplete, dataChanged } from '../../src/store/slices/appSlice';
import { seedDemoData } from '../../src/features/demo/seedDemoData';
import { setSetting, SettingKeys } from '../../src/database/repositories/settingsRepository';
import { requestSmsAndNotificationPermissions } from '../../src/features/sms/services/permission.service';

const features = [
  {
    icon: Zap,
    title: 'Automatic Bank SMS Parsing',
    description: 'Debit alerts from Indian banks (HDFC, SBI, ICICI, Axis, Kotak, PayTM) are instantly detected without manual typing.',
  },
  {
    icon: Sparkles,
    title: 'Smart 1-Tap Categorization',
    description: 'Assign Food, Groceries, Travel, or Bills in a single tap. Spendly remembers your merchants for next time.',
  },
  {
    icon: Lock,
    title: '100% Offline & Private',
    description: 'No accounts, no external servers, no cloud leakage. Your financial history never leaves your device.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  async function completeOnboarding(seed: boolean) {
    setLoading(true);
    try {
      // Request SMS and notification permissions from user
      await requestSmsAndNotificationPermissions();

      if (seed) {
        await seedDemoData();
      }
      await setSetting(SettingKeys.ONBOARDING_COMPLETE, 'true');
      dispatch(setOnboardingComplete(true));
      dispatch(dataChanged());
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      dispatch(setOnboardingComplete(true));
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}
      >
        {/* Header Icon */}
        <SlideUpReveal index={0}>
          <View className="w-16 h-16 rounded-3xl bg-accent/15 items-center justify-center mb-6 mt-4">
            <ShieldCheck size={36} color="#6F7F52" />
          </View>
        </SlideUpReveal>

        {/* Title */}
        <SlideUpReveal index={1}>
          <Text className="text-3xl font-extrabold text-ink dark:text-ink-dark mb-2">
            Spendly
          </Text>
          <Text className="text-lg font-bold text-accent mb-3">
            Automatic Offline Expense Tracker
          </Text>
          <Text className="text-sm text-muted dark:text-muted-dark mb-6 leading-5">
            Effortlessly track your daily spending directly from bank SMS alerts with absolute on-device privacy.
          </Text>
        </SlideUpReveal>

        {/* Feature List */}
        <View className="gap-y-4 mb-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <SlideUpReveal key={feat.title} index={index + 2}>
                <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark flex-row items-start shadow-sm">
                  <View className="w-10 h-10 rounded-xl bg-bg dark:bg-bg-dark items-center justify-center mr-3 mt-0.5">
                    <Icon size={20} color="#6F7F52" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-ink dark:text-ink-dark">
                      {feat.title}
                    </Text>
                    <Text className="text-xs text-muted dark:text-muted-dark mt-1 leading-4">
                      {feat.description}
                    </Text>
                  </View>
                </View>
              </SlideUpReveal>
            );
          })}
        </View>

        {/* Action Buttons */}
        <SlideUpReveal index={5}>
          <View className="gap-y-3 mb-4">
            <PrimaryButton
              label={loading ? 'Setting up...' : 'Get Started with Sample Data'}
              onPress={() => completeOnboarding(true)}
              disabled={loading}
            />

            <SecondaryButton
              label="Start with Clean Slate"
              onPress={() => completeOnboarding(false)}
              disabled={loading}
            />
          </View>
        </SlideUpReveal>

        <Text className="text-center text-[11px] text-muted dark:text-muted-dark mt-2">
          Transactions are read from bank SMS on your phone. Nothing is ever uploaded to any cloud.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
