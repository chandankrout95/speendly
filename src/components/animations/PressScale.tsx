import type { ReactNode } from 'react';
import { Pressable, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface PressScaleProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  scale?: number;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressScale({
  children,
  onPress,
  disabled,
  scale: targetScale = 0.97,
  className,
  ...rest
}: PressScaleProps) {
  const s = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { s.value = withTiming(targetScale, { duration: 80 }); }}
      onPressOut={() => { s.value = withTiming(1, { duration: 120 }); }}
      style={animStyle}
      className={className}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
