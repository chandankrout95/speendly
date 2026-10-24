import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: ReactNode;
}

const base =
  'rounded-card border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark';

export function Card({ children, className, ...rest }: CardProps & { className?: string }) {
  return (
    <View className={`${base} ${className ?? ''}`} {...rest}>
      {children}
    </View>
  );
}
