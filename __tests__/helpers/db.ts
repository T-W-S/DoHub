import { beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DB } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

export function setupInMemoryDb(setDb: (db: DB) => void): void {
  let db: DB;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    setDb(db);
  });

  afterEach(() => {
    db.close();
  });
}
