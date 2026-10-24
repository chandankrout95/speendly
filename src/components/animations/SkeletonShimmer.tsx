import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonShimmer({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className,
}: SkeletonShimmerProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#E9EAE3',
        },
        animStyle,
      ]}
      className={className}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View className="gap-4 p-5">
      <SkeletonShimmer height={24} width={200} />
      <SkeletonShimmer height={16} width={280} />
      <SkeletonShimmer height={120} borderRadius={16} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <SkeletonShimmer height={80} borderRadius={16} />
        </View>
        <View className="flex-1">
          <SkeletonShimmer height={80} borderRadius={16} />
        </View>
      </View>
      <SkeletonShimmer height={200} borderRadius={16} />
      <SkeletonShimmer height={160} borderRadius={16} />
    </View>
  );
}
