import { getDatabase } from '../database';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    key,
    value,
    now,
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', key);
}

// Well-known setting keys
export const SettingKeys = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  DISPLAY_NAME: 'display_name',
  DEMO_DATA_SEEDED: 'demo_data_seeded',
  THEME: 'theme',
  CURRENCY: 'currency',
} as const;
