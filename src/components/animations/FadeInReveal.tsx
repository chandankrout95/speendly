import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FadeInRevealProps {
  children: ReactNode;
  /** Stagger index; delay is capped so the full entrance stays short. */
  index?: number;
}

export function FadeInReveal({ children, index = 0 }: FadeInRevealProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduceMotion(v);
    });
    return () => {
      active = false;
    };
  }, []);

  if (reduceMotion) return <>{children}</>;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(320)}>
      {children}
    </Animated.View>
  );
}
