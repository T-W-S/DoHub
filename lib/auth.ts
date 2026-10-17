import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { randomBytes } from 'crypto';

export function hasAdmin(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT id FROM admin_user WHERE id = 1').get();
  return !!row;
}

export function createAdmin(email: string, password: string): void {
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  const hash = bcrypt.hashSync(password, 12);
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO admin_user (id, email, password_hash) VALUES (1, ?, ?)').run(
    email.toLowerCase(),
    hash
  );
}

export function verifyCredentials(email: string, password: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT password_hash FROM admin_user WHERE id = 1 AND email = ?')
    .get(email.toLowerCase()) as { password_hash: string } | undefined;
  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}

export function getAdminEmail(): string | null {
  const db = getDb();
  const row = db.prepare('SELECT email FROM admin_user WHERE id = 1').get() as
    | { email: string }
    | undefined;
  return row?.email ?? null;
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function createSession(userAgent?: string): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const db = getDb();
  db.prepare(`INSERT INTO sessions (token, expires_at, user_agent) VALUES (?, ?, ?)`).run(
    token,
    expiresAt,
    userAgent ?? null
  );
  return token;
}

export function validateSession(token: string): boolean {
  if (!token) return false;
  const db = getDb();
  const row = db
    .prepare('SELECT expires_at FROM sessions WHERE token = ?')
    .get(token) as { expires_at: string } | undefined;
  if (!row) return false;
  const expired = new Date(row.expires_at).getTime() < Date.now();
  if (expired) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return false;
  }
  return true;
}

export function destroySession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function cleanupExpiredSessions(): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}
