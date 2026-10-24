export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  colorToken: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  { id: 'food', name: 'Food & Dining', icon: 'utensils', colorToken: '#E67E22', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', colorToken: '#27AE60', isDefault: true },
  { id: 'travel', name: 'Travel', icon: 'map-pin', colorToken: '#3498DB', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', colorToken: '#9B59B6', isDefault: true },
  { id: 'bills', name: 'Bills & Utilities', icon: 'zap', colorToken: '#F39C12', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', colorToken: '#E74C3C', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart', colorToken: '#1ABC9C', isDefault: true },
  { id: 'education', name: 'Education', icon: 'book-open', colorToken: '#2980B9', isDefault: true },
  { id: 'personal', name: 'Personal Care', icon: 'smile', colorToken: '#E91E63', isDefault: true },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'repeat', colorToken: '#8E44AD', isDefault: true },
  { id: 'transfers', name: 'Transfers', icon: 'arrow-left-right', colorToken: '#7F8C8D', isDefault: true },
  { id: 'other', name: 'Other', icon: 'more-horizontal', colorToken: '#95A5A6', isDefault: true },
];
