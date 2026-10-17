import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { runMigrations } from './migrations';

export type DB = Database.Database;

let dbInstance: DB | null = null;

const DB_DIR = process.env.DOCKER_HUB_DB_DIR || join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'docker-hub.db');

export function getDb(): DB {
  if (dbInstance) return dbInstance;

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  dbInstance = db;
  return db;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
