import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Home,
  ReceiptText,
  PieChart,
  Wallet,
  Settings2,
} from 'lucide-react-native';

interface TabRoute {
  key: string;
  name: string;
}

export interface CustomTabBarProps {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors?: any;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string, params?: any) => void;
  };
  [key: string]: any;
}

interface TabConfig {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Home',
    Icon: Home,
  },
  transactions: {
    name: 'transactions',
    label: 'Expenses',
    Icon: ReceiptText,
  },
  analytics: {
    name: 'analytics',
    label: 'Insights',
    Icon: PieChart,
  },
  budgets: {
    name: 'budgets',
    label: 'Budgets',
    Icon: Wallet,
  },
  settings: {
    name: 'settings',
    label: 'Settings',
    Icon: Settings2,
  },
};

function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: TabRoute;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const config = TAB_CONFIGS[route.name] || {
    name: route.name,
    label: route.name,
    Icon: Home,
  };
  const IconComponent = config.Icon;

  // Reveal animation shared values (timing-based, no springs)
  const activeProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(isFocused ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: isFocused ? 'rgba(111, 127, 82, 0.15)' : 'transparent',
    opacity: isFocused ? 1 : 0.65,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      style={styles.tabPressable}
    >
      <Animated.View style={[styles.tabContent, animatedContainerStyle]}>
        <IconComponent
          size={20}
          color={isFocused ? '#6F7F52' : '#737970'}
          strokeWidth={isFocused ? 2.3 : 1.8}
        />
        {isFocused && (
          <Animated.Text
            entering={FadeIn.duration(180).easing(Easing.out(Easing.quad))}
            exiting={FadeOut.duration(120)}
            style={styles.activeLabel}
            numberOfLines={1}
          >
            {config.label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: TabRoute, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 234, 227, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 36,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F7F52',
    marginLeft: 6,
  },
});
