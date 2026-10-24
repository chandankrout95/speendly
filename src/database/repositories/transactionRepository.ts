import { getDatabase } from '../database';
import type {
  Transaction,
  TransactionInsert,
  TransactionFilter,
  TransactionSummary,
  DailySpending,
  CategorySpending,
} from '../../types/transaction.types';
import type { Paise } from '../../utils/currency';

// ─── Insert ────────────────────────────────────────────────────────────────────

export async function insertTransaction(txn: TransactionInsert): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR IGNORE INTO transactions
     (id, amountMinor, currency, transactionType, categoryId, merchantName,
      transactionReference, transactionDate, receivedAt, source,
      categorizationStatus, confidence, fingerprint, originalMessageHash,
      accountAlias, isExcluded, relatedTransactionId, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    txn.id,
    txn.amountMinor ?? 0,
    txn.currency || 'INR',
    txn.transactionType || 'expense',
    txn.categoryId ?? null,
    txn.merchantName ?? null,
    txn.transactionReference ?? null,
    txn.transactionDate || now,
    txn.receivedAt || now,
    txn.source || 'manual',
    txn.categorizationStatus || 'pending',
    txn.confidence ?? null,
    txn.fingerprint,
    txn.originalMessageHash ?? null,
    txn.accountAlias ?? null,
    txn.isExcluded ? 1 : 0,
    txn.relatedTransactionId ?? null,
    txn.notes ?? null,
    now,
    now,
  );
}

// ─── Query ─────────────────────────────────────────────────────────────────────

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM transactions WHERE id = ?',
    id,
  );
  return row ? mapRow(row) : null;
}

export async function getTransactions(filter: TransactionFilter = {}): Promise<Transaction[]> {
  const db = await getDatabase();
  const { sql, params } = buildFilterQuery(filter);
  const rows = await db.getAllAsync<Record<string, unknown>>(sql, ...(params as any[]));
  return rows.map(mapRow);
}

export async function getTransactionCount(filter: TransactionFilter = {}): Promise<number> {
  const db = await getDatabase();
  const { whereClause, params } = buildWhere(filter);
  const result = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM transactions ${whereClause}`,
    ...(params as any[]),
  );
  return result?.cnt ?? 0;
}

// ─── Aggregations ──────────────────────────────────────────────────────────────

export async function getTransactionSummary(
  startDate: string,
  endDate: string,
): Promise<TransactionSummary> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{
    totalExpense: number | null;
    totalIncome: number | null;
    transactionCount: number;
    categorizedCount: number;
    pendingCount: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN transactionType = 'expense' AND isExcluded = 0 THEN amountMinor ELSE 0 END), 0) as totalExpense,
       COALESCE(SUM(CASE WHEN (transactionType = 'income' OR transactionType = 'refund') AND isExcluded = 0 THEN amountMinor ELSE 0 END), 0) as totalIncome,
       COUNT(*) as transactionCount,
       SUM(CASE WHEN categorizationStatus != 'pending' THEN 1 ELSE 0 END) as categorizedCount,
       SUM(CASE WHEN categorizationStatus = 'pending' THEN 1 ELSE 0 END) as pendingCount
     FROM transactions
     WHERE transactionDate >= ? AND transactionDate < ? AND isExcluded = 0`,
    startDate,
    endDate,
  );

  return {
    totalExpense: ((result?.totalExpense ?? 0) as number) as Paise,
    totalIncome: ((result?.totalIncome ?? 0) as number) as Paise,
    transactionCount: result?.transactionCount ?? 0,
    categorizedCount: result?.categorizedCount ?? 0,
    pendingCount: result?.pendingCount ?? 0,
  };
}

export async function getDailySpending(
  startDate: string,
  endDate: string,
): Promise<DailySpending[]> {
  const db = await getDatabase();
  return db.getAllAsync<DailySpending>(
    `SELECT
       date(transactionDate) as date,
       SUM(amountMinor) as totalMinor,
       COUNT(*) as count
     FROM transactions
     WHERE transactionType = 'expense'
       AND isExcluded = 0
       AND transactionDate >= ? AND transactionDate < ?
     GROUP BY date(transactionDate)
     ORDER BY date ASC`,
    startDate,
    endDate,
  );
}

export async function getCategorySpending(
  startDate: string,
  endDate: string,
): Promise<CategorySpending[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    totalMinor: number;
    count: number;
  }>(
    `SELECT
       COALESCE(t.categoryId, 'other') as categoryId,
       COALESCE(c.name, 'Other') as categoryName,
       COALESCE(c.icon, 'more-horizontal') as categoryIcon,
       COALESCE(c.colorToken, '#95A5A6') as categoryColor,
       SUM(t.amountMinor) as totalMinor,
       COUNT(*) as count
     FROM transactions t
     LEFT JOIN categories c ON t.categoryId = c.id
     WHERE t.transactionType = 'expense'
       AND t.isExcluded = 0
       AND t.transactionDate >= ? AND t.transactionDate < ?
     GROUP BY COALESCE(t.categoryId, 'other')
     ORDER BY totalMinor DESC`,
    startDate,
    endDate,
  );

  const grandTotal = rows.reduce((sum, r) => sum + r.totalMinor, 0);
  return rows.map((r) => ({
    ...r,
    totalMinor: r.totalMinor as Paise,
    percentage: grandTotal > 0 ? Math.round((r.totalMinor / grandTotal) * 100) : 0,
  }));
}

export async function getPendingTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM transactions
     WHERE categorizationStatus = 'pending' AND isExcluded = 0
     ORDER BY transactionDate DESC`,
  );
  return rows.map(mapRow);
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM transactions
     WHERE isExcluded = 0
     ORDER BY transactionDate DESC
     LIMIT ?`,
    limit,
  );
  return rows.map(mapRow);
}

// ─── Update ────────────────────────────────────────────────────────────────────

export async function updateTransactionCategory(
  id: string,
  categoryId: string,
  status: 'auto' | 'manual' = 'manual',
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE transactions SET categoryId = ?, categorizationStatus = ?, updatedAt = ? WHERE id = ?`,
    categoryId,
    status,
    now,
    id,
  );
}

export async function updateTransactionType(
  id: string,
  type: string,
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE transactions SET transactionType = ?, updatedAt = ? WHERE id = ?`,
    type,
    now,
    id,
  );
}

export async function excludeTransaction(id: string, exclude: boolean): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE transactions SET isExcluded = ?, categorizationStatus = ?, updatedAt = ? WHERE id = ?`,
    exclude ? 1 : 0,
    exclude ? 'excluded' : 'pending',
    now,
    id,
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function deleteAllTransactions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions');
}

// ─── Fingerprint check ────────────────────────────────────────────────────────

export async function transactionExistsByFingerprint(fingerprint: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM transactions WHERE fingerprint = ?',
    fingerprint,
  );
  return (result?.cnt ?? 0) > 0;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    amountMinor: Number(row.amountMinor) as Paise,
    currency: String(row.currency || 'INR'),
    transactionType: row.transactionType as Transaction['transactionType'],
    categoryId: (row.categoryId as string) || null,
    merchantName: (row.merchantName as string) || null,
    transactionReference: (row.transactionReference as string) || null,
    transactionDate: String(row.transactionDate),
    receivedAt: String(row.receivedAt),
    source: row.source as Transaction['source'],
    categorizationStatus: row.categorizationStatus as Transaction['categorizationStatus'],
    confidence: row.confidence != null ? Number(row.confidence) : null,
    fingerprint: String(row.fingerprint),
    originalMessageHash: (row.originalMessageHash as string) || null,
    accountAlias: (row.accountAlias as string) || null,
    isExcluded: row.isExcluded === 1,
    relatedTransactionId: (row.relatedTransactionId as string) || null,
    notes: (row.notes as string) || null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

interface WhereResult {
  whereClause: string;
  params: unknown[];
}

function buildWhere(filter: TransactionFilter): WhereResult {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.startDate) {
    conditions.push('transactionDate >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push('transactionDate < ?');
    params.push(filter.endDate);
  }
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    const placeholders = filter.categoryIds.map(() => '?').join(', ');
    conditions.push(`categoryId IN (${placeholders})`);
    params.push(...filter.categoryIds);
  }
  if (filter.transactionTypes && filter.transactionTypes.length > 0) {
    const placeholders = filter.transactionTypes.map(() => '?').join(', ');
    conditions.push(`transactionType IN (${placeholders})`);
    params.push(...filter.transactionTypes);
  }
  if (filter.categorizationStatuses && filter.categorizationStatuses.length > 0) {
    const placeholders = filter.categorizationStatuses.map(() => '?').join(', ');
    conditions.push(`categorizationStatus IN (${placeholders})`);
    params.push(...filter.categorizationStatuses);
  }
  if (filter.searchQuery) {
    conditions.push('(merchantName LIKE ? OR notes LIKE ?)');
    const like = `%${filter.searchQuery}%`;
    params.push(like, like);
  }
  if (filter.isExcluded !== undefined) {
    conditions.push('isExcluded = ?');
    params.push(filter.isExcluded ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

function buildFilterQuery(filter: TransactionFilter): { sql: string; params: unknown[] } {
  const { whereClause, params } = buildWhere(filter);
  let sql = `SELECT * FROM transactions ${whereClause} ORDER BY transactionDate DESC`;
  if (filter.limit) {
    sql += ` LIMIT ?`;
    params.push(filter.limit);
    if (filter.offset) {
      sql += ` OFFSET ?`;
      params.push(filter.offset);
    }
  }
  return { sql, params };
}
