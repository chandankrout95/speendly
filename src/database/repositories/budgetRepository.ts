import { getDatabase } from '../database';
import type { Budget, BudgetInsert, BudgetProgress } from '../../types/budget.types';
import type { Paise } from '../../utils/currency';

export async function getAllBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM budgets WHERE isActive = 1 ORDER BY name ASC',
  );
  return rows.map(mapBudgetRow);
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM budgets WHERE id = ?',
    id,
  );
  return row ? mapBudgetRow(row) : null;
}

export async function insertBudget(budget: BudgetInsert): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO budgets (id, name, amountMinor, currency, period, categoryId, startDate, endDate, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    budget.id,
    budget.name,
    budget.amountMinor,
    budget.currency || 'INR',
    budget.period || 'monthly',
    budget.categoryId ?? null,
    budget.startDate,
    budget.endDate ?? null,
    budget.isActive !== false ? 1 : 0,
    now,
    now,
  );
}

export async function updateBudget(
  id: string,
  updates: Partial<BudgetInsert>,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const params: any[] = [now];

  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.amountMinor !== undefined) { sets.push('amountMinor = ?'); params.push(updates.amountMinor); }
  if (updates.period !== undefined) { sets.push('period = ?'); params.push(updates.period); }
  if (updates.categoryId !== undefined) { sets.push('categoryId = ?'); params.push(updates.categoryId ?? null); }
  if (updates.isActive !== undefined) { sets.push('isActive = ?'); params.push(updates.isActive ? 1 : 0); }

  params.push(id);
  await db.runAsync(`UPDATE budgets SET ${sets.join(', ')} WHERE id = ?`, ...(params as any[]));
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

export async function getBudgetProgress(
  startDate: string,
  endDate: string,
): Promise<BudgetProgress[]> {
  const db = await getDatabase();
  const budgets = await getAllBudgets();
  const results: BudgetProgress[] = [];

  for (const budget of budgets) {
    let spentMinor: Paise = 0 as Paise;

    if (budget.categoryId) {
      const row = await db.getFirstAsync<{ total: number | null }>(
        `SELECT COALESCE(SUM(amountMinor), 0) as total
         FROM transactions
         WHERE transactionType = 'expense'
           AND isExcluded = 0
           AND categoryId = ?
           AND transactionDate >= ? AND transactionDate < ?`,
        budget.categoryId,
        startDate,
        endDate,
      );
      spentMinor = ((row?.total ?? 0) as number) as Paise;
    } else {
      const row = await db.getFirstAsync<{ total: number | null }>(
        `SELECT COALESCE(SUM(amountMinor), 0) as total
         FROM transactions
         WHERE transactionType = 'expense'
           AND isExcluded = 0
           AND transactionDate >= ? AND transactionDate < ?`,
        startDate,
        endDate,
      );
      spentMinor = ((row?.total ?? 0) as number) as Paise;
    }

    const remainingMinor = Math.max(0, budget.amountMinor - spentMinor) as Paise;
    const percentage = budget.amountMinor > 0
      ? Math.round((spentMinor / budget.amountMinor) * 100)
      : 0;

    // Get category name if category-specific budget
    let categoryName: string | null = null;
    if (budget.categoryId) {
      const cat = await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM categories WHERE id = ?',
        budget.categoryId,
      );
      categoryName = cat?.name ?? null;
    }

    results.push({
      budget,
      spentMinor,
      remainingMinor,
      percentage,
      isExceeded: spentMinor > budget.amountMinor,
      isApproaching: percentage >= 80 && percentage < 100,
      categoryName,
    });
  }

  return results;
}

function mapBudgetRow(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    name: String(row.name),
    amountMinor: Number(row.amountMinor) as Paise,
    currency: String(row.currency || 'INR'),
    period: (row.period as Budget['period']) || 'monthly',
    categoryId: row.categoryId ? String(row.categoryId) : null,
    startDate: String(row.startDate),
    endDate: row.endDate ? String(row.endDate) : null,
    isActive: row.isActive === 1,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}
