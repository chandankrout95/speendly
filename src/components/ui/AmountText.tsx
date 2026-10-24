import { Text } from 'react-native';
import { formatPaise, type Paise } from '../../utils/currency';

interface AmountTextProps {
  amountMinor: Paise;
  size?: 'sm' | 'md' | 'xl';
}

const sizes = { sm: 'text-sm', md: 'text-lg', xl: 'text-4xl' } as const;

export function AmountText({ amountMinor, size = 'md' }: AmountTextProps) {
  return (
    <Text className={`${sizes[size]} font-bold text-ink dark:text-ink-dark`}>
      {formatPaise(amountMinor)}
    </Text>
  );
}
