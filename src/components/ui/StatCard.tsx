import { View, Text } from 'react-native';
import { Card } from './Card';
import type { Paise } from '../../utils/currency';
import { formatPaise } from '../../utils/currency';
import { PressScale } from '../animations/PressScale';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  amountMinor: Paise;
  icon: ReactNode;
  onPress?: () => void;
  subtitle?: string;
  accentColor?: string;
}

export function StatCard({ label, amountMinor, icon, onPress, subtitle, accentColor }: StatCardProps) {
  const content = (
    <Card className="min-w-[140px] flex-1">
      <View className="flex-row items-center justify-between">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: (accentColor ?? '#6F7F52') + '18' }}
        >
          {icon}
        </View>
      </View>
      <Text className="mt-2 text-lg font-bold text-ink dark:text-ink-dark">
        {formatPaise(amountMinor)}
      </Text>
      <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
      {subtitle ? (
        <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">{subtitle}</Text>
      ) : null}
    </Card>
  );

  if (onPress) {
    return <PressScale onPress={onPress} className="flex-1">{content}</PressScale>;
  }
  return content;
}
