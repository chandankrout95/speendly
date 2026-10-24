import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
}

export function ScreenContainer({ children, scroll = true }: ScreenContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerClassName="gap-4 p-5 pb-10">{children}</ScrollView>
      ) : (
        <View className="flex-1 gap-4 p-5">{children}</View>
      )}
    </SafeAreaView>
  );
}
