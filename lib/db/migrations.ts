import type { Database } from 'better-sqlite3';

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_initial_schema',
      sql: `
        CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE applications (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          public_url TEXT NOT NULL,
          health_check_url TEXT,
          icon TEXT,
          category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
          tags TEXT NOT NULL DEFAULT '[]',
          notes TEXT,
          docker_label TEXT,
          public_monitoring_enabled INTEGER NOT NULL DEFAULT 1,
          internal_monitoring_enabled INTEGER NOT NULL DEFAULT 0,
          failure_threshold INTEGER NOT NULL DEFAULT 3,
          last_public_status TEXT DEFAULT 'pending',
          last_public_checked_at TEXT,
          last_public_response_ms INTEGER,
          last_public_http_status INTEGER,
          last_internal_status TEXT DEFAULT 'pending',
          last_internal_checked_at TEXT,
          last_internal_response_ms INTEGER,
          last_internal_http_status INTEGER,
          consecutive_failures INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX idx_applications_category ON applications(category_id);
        CREATE INDEX idx_applications_created ON applications(created_at);

        CREATE TABLE check_results (
          id TEXT PRIMARY KEY,
          application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          check_type TEXT NOT NULL CHECK (check_type IN ('public','internal')),
          status TEXT NOT NULL CHECK (status IN ('up','down')),
          http_status_code INTEGER,
          response_time_ms INTEGER,
          error_message TEXT,
          checked_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX idx_check_results_app ON check_results(application_id);
        CREATE INDEX idx_check_results_type_date ON check_results(check_type, checked_at);
        CREATE INDEX idx_check_results_date ON check_results(checked_at);

        CREATE TABLE app_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          monitoring_interval_seconds INTEGER NOT NULL DEFAULT 300,
          retention_days INTEGER NOT NULL DEFAULT 30,
          check_timeout_ms INTEGER NOT NULL DEFAULT 10000,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT OR IGNORE INTO app_settings (id) VALUES (1);

        CREATE TABLE admin_user (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE sessions (
          token TEXT PRIMARY KEY,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL,
          user_agent TEXT
        );

        CREATE INDEX idx_sessions_expires ON sessions(expires_at);
      `,
    },
  ];

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name)
  );

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      db.exec(migration.sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
    }
  }
}
