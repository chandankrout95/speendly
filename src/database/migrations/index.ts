import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../../types/category.types';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          colorToken TEXT NOT NULL,
          isDefault INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          amountMinor INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          transactionType TEXT NOT NULL DEFAULT 'expense',
          categoryId TEXT,
          merchantName TEXT,
          transactionReference TEXT,
          transactionDate TEXT NOT NULL,
          receivedAt TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT 'sms',
          categorizationStatus TEXT NOT NULL DEFAULT 'pending',
          confidence REAL,
          fingerprint TEXT NOT NULL,
          originalMessageHash TEXT,
          accountAlias TEXT,
          isExcluded INTEGER NOT NULL DEFAULT 0,
          relatedTransactionId TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
          FOREIGN KEY (relatedTransactionId) REFERENCES transactions(id) ON DELETE SET NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_fingerprint ON transactions(fingerprint);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transactionDate);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(categorizationStatus);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transactionType);
        CREATE INDEX IF NOT EXISTS idx_transactions_excluded ON transactions(isExcluded);

        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amountMinor INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'INR',
          period TEXT NOT NULL DEFAULT 'monthly',
          categoryId TEXT,
          startDate TEXT NOT NULL,
          endDate TEXT,
          isActive INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS merchant_rules (
          id TEXT PRIMARY KEY NOT NULL,
          merchantPattern TEXT NOT NULL,
          normalizedMerchant TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          matchType TEXT NOT NULL DEFAULT 'contains',
          isEnabled INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS processing_events (
          id TEXT PRIMARY KEY NOT NULL,
          eventFingerprint TEXT NOT NULL,
          eventType TEXT NOT NULL,
          processingStatus TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_processing_fingerprint ON processing_events(eventFingerprint);

        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER NOT NULL
        );
      `);

      // Seed default categories
      const now = new Date().toISOString();
      for (const cat of DEFAULT_CATEGORIES) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories (id, name, icon, colorToken, isDefault, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          cat.id,
          cat.name,
          cat.icon,
          cat.colorToken,
          cat.isDefault ? 1 : 0,
          now,
          now,
        );
      }

      await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', 1);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure schema_version table exists for first run
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version',
  );
  const currentVersion = result?.version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
    }
  }
}
