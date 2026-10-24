import React from 'react';
import {
  Utensils,
  ShoppingCart,
  MapPin,
  ShoppingBag,
  Zap,
  Film,
  Heart,
  BookOpen,
  Smile,
  Repeat,
  ArrowLeftRight,
  MoreHorizontal,
  DollarSign,
  Coffee,
  Car,
  Home,
  Briefcase,
  Gift,
} from 'lucide-react-native';

interface CategoryIconProps {
  icon: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ icon, size = 20, color = '#6F7F52' }: CategoryIconProps) {
  switch (icon) {
    case 'utensils':
    case 'food':
      return <Utensils size={size} color={color} />;
    case 'shopping-cart':
    case 'groceries':
      return <ShoppingCart size={size} color={color} />;
    case 'map-pin':
    case 'travel':
      return <MapPin size={size} color={color} />;
    case 'shopping-bag':
    case 'shopping':
      return <ShoppingBag size={size} color={color} />;
    case 'zap':
    case 'bills':
      return <Zap size={size} color={color} />;
    case 'film':
    case 'entertainment':
      return <Film size={size} color={color} />;
    case 'heart':
    case 'health':
      return <Heart size={size} color={color} />;
    case 'book-open':
    case 'education':
      return <BookOpen size={size} color={color} />;
    case 'smile':
    case 'personal':
      return <Smile size={size} color={color} />;
    case 'repeat':
    case 'subscriptions':
      return <Repeat size={size} color={color} />;
    case 'arrow-left-right':
    case 'transfers':
      return <ArrowLeftRight size={size} color={color} />;
    case 'coffee':
      return <Coffee size={size} color={color} />;
    case 'car':
      return <Car size={size} color={color} />;
    case 'home':
      return <Home size={size} color={color} />;
    case 'briefcase':
      return <Briefcase size={size} color={color} />;
    case 'gift':
      return <Gift size={size} color={color} />;
    case 'dollar-sign':
      return <DollarSign size={size} color={color} />;
    case 'more-horizontal':
    case 'other':
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
}
