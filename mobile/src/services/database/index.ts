/**
 * SQLite preparation stub (expo-sqlite).
 * Phase 2: init hook only — no schema migrations yet.
 * Later: progress rows, card_stats, session analytics.
 */

export type DatabaseStatus = 'not_initialized' | 'ready' | 'error';

let status: DatabaseStatus = 'not_initialized';

export function getDatabaseStatus(): DatabaseStatus {
  return status;
}

export async function initDatabase(): Promise<void> {
  // Intentionally empty schema for Phase 2.
  // Next: openDatabaseAsync + CREATE TABLE progress / card_stats
  status = 'ready';
}

export async function resetDatabase(): Promise<void> {
  status = 'not_initialized';
}
