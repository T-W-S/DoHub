import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DB } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

let testDb: DB;

vi.mock('@/lib/db', () => ({
  getDb: () => testDb,
}));

import {
  hasAdmin,
  createAdmin,
  verifyCredentials,
  getAdminEmail,
  createSession,
  validateSession,
  destroySession,
  cleanupExpiredSessions,
} from '@/lib/auth';

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');
  runMigrations(testDb);
});

afterEach(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// Admin management
// ---------------------------------------------------------------------------
describe('Admin management', () => {
  it('hasAdmin returns false when no admin exists', () => {
    expect(hasAdmin()).toBe(false);
  });

  it('createAdmin and hasAdmin returns true', () => {
    createAdmin('admin@example.com', 'securepass');
    expect(hasAdmin()).toBe(true);
  });

  it('createAdmin lowercases the email', () => {
    createAdmin('Admin@Example.COM', 'securepass');
    expect(getAdminEmail()).toBe('admin@example.com');
  });

  it('createAdmin rejects passwords shorter than 8 characters', () => {
    expect(() => createAdmin('a@b.com', 'short')).toThrow('Password must be at least 8 characters');
  });

  it('createAdmin replaces existing admin (INSERT OR REPLACE)', () => {
    createAdmin('first@example.com', 'password1');
    createAdmin('second@example.com', 'password2');
    expect(getAdminEmail()).toBe('second@example.com');
    expect(hasAdmin()).toBe(true);
  });

  it('getAdminEmail returns null when no admin exists', () => {
    expect(getAdminEmail()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Credential verification
// ---------------------------------------------------------------------------
describe('verifyCredentials', () => {
  it('returns true for correct credentials', () => {
    createAdmin('user@test.com', 'correctpass');
    expect(verifyCredentials('user@test.com', 'correctpass')).toBe(true);
  });

  it('returns false for wrong password', () => {
    createAdmin('user@test.com', 'correctpass');
    expect(verifyCredentials('user@test.com', 'wrongpass')).toBe(false);
  });

  it('returns false for wrong email', () => {
    createAdmin('user@test.com', 'correctpass');
    expect(verifyCredentials('other@test.com', 'correctpass')).toBe(false);
  });

  it('returns false when no admin exists', () => {
    expect(verifyCredentials('nobody@test.com', 'password')).toBe(false);
  });

  it('email comparison is case-insensitive', () => {
    createAdmin('User@Test.com', 'mypassword');
    expect(verifyCredentials('USER@TEST.COM', 'mypassword')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
describe('Session management', () => {
  it('createSession returns a hex token', () => {
    const token = createSession();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('createSession stores user agent', () => {
    const token = createSession('Mozilla/5.0');
    const row = testDb
      .prepare('SELECT user_agent FROM sessions WHERE token = ?')
      .get(token) as { user_agent: string };
    expect(row.user_agent).toBe('Mozilla/5.0');
  });

  it('createSession with no user agent stores null', () => {
    const token = createSession();
    const row = testDb
      .prepare('SELECT user_agent FROM sessions WHERE token = ?')
      .get(token) as { user_agent: string | null };
    expect(row.user_agent).toBeNull();
  });

  it('validateSession returns true for a valid (non-expired) session', () => {
    const token = createSession();
    expect(validateSession(token)).toBe(true);
  });

  it('validateSession returns false for unknown token', () => {
    expect(validateSession('bogus')).toBe(false);
  });

  it('validateSession returns false for empty string', () => {
    expect(validateSession('')).toBe(false);
  });

  it('validateSession returns false and deletes expired session', () => {
    const token = createSession();
    // Manually expire the session
    testDb
      .prepare("UPDATE sessions SET expires_at = datetime('now', '-1 day') WHERE token = ?")
      .run(token);
    expect(validateSession(token)).toBe(false);
    // The row should have been deleted
    const row = testDb.prepare('SELECT token FROM sessions WHERE token = ?').get(token);
    expect(row).toBeUndefined();
  });

  it('destroySession removes the session', () => {
    const token = createSession();
    destroySession(token);
    expect(validateSession(token)).toBe(false);
  });

  it('destroySession is a no-op for unknown token', () => {
    // Should not throw
    destroySession('nonexistent');
  });

  it('cleanupExpiredSessions removes only expired sessions', () => {
    const validToken = createSession();
    const expiredToken = createSession();
    testDb
      .prepare("UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE token = ?")
      .run(expiredToken);

    cleanupExpiredSessions();

    expect(validateSession(validToken)).toBe(true);
    const row = testDb.prepare('SELECT token FROM sessions WHERE token = ?').get(expiredToken);
    expect(row).toBeUndefined();
  });

  it('multiple sessions can coexist', () => {
    const t1 = createSession('Agent1');
    const t2 = createSession('Agent2');
    expect(validateSession(t1)).toBe(true);
    expect(validateSession(t2)).toBe(true);
    destroySession(t1);
    expect(validateSession(t1)).toBe(false);
    expect(validateSession(t2)).toBe(true);
  });
});
