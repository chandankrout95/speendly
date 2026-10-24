import { Pressable, Text } from 'react-native';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export function SecondaryButton({ label, onPress, disabled = false, className = '' }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[44px] items-center justify-center rounded-card border border-line px-5 dark:border-line-dark ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
    >
      <Text className="text-sm font-semibold text-ink dark:text-ink-dark">{label}</Text>
    </Pressable>
  );
}
