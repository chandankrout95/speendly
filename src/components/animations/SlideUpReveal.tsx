import type { ReactNode } from 'react';
import Animated, { FadeInUp, Easing } from 'react-native-reanimated';

interface SlideUpRevealProps {
  children: ReactNode;
  index?: number;
  delay?: number;
}

export function SlideUpReveal({ children, index = 0, delay = 0 }: SlideUpRevealProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay + Math.min(index, 8) * 45)
        .duration(280)
        .easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}
