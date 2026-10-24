import { getDatabase } from '../database';
import type { Category } from '../../types/category.types';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', id);
}

export async function insertCategory(
  category: Omit<Category, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, colorToken, isDefault, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    category.id,
    category.name,
    category.icon,
    category.colorToken,
    category.isDefault ? 1 : 0,
    now,
    now,
  );
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'icon' | 'colorToken'>>,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const params: unknown[] = [now];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    params.push(updates.name);
  }
  if (updates.icon !== undefined) {
    sets.push('icon = ?');
    params.push(updates.icon);
  }
  if (updates.colorToken !== undefined) {
    sets.push('colorToken = ?');
    params.push(updates.colorToken);
  }
  params.push(id);
  await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, ...(params as any[]));
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ? AND isDefault = 0', id);
}
