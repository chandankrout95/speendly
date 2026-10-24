import React from 'react';
import { View, Text } from 'react-native';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color?: string;
  isPending?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadge({
  name,
  icon,
  color = '#6F7F52',
  isPending = false,
  size = 'md',
}: CategoryBadgeProps) {
  if (isPending) {
    return (
      <View className="flex-row items-center rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 border border-amber-300 dark:border-amber-800/60">
        <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
        <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">
          Needs Category
        </Text>
      </View>
    );
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={{ backgroundColor: `${color}18` }}
      className={`flex-row items-center rounded-full ${
        isSmall ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
    >
      <CategoryIcon icon={icon} size={isSmall ? 12 : 14} color={color} />
      <Text
        style={{ color }}
        className={`font-semibold ml-1.5 ${isSmall ? 'text-[11px]' : 'text-xs'}`}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}
