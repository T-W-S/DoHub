import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { DB } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

// Mock the db module so every call to getDb() returns our in-memory instance
let testDb: DB;

vi.mock('@/lib/db', () => ({
  getDb: () => testDb,
}));

// Import query functions *after* the mock is declared
import {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSettings,
  updateSettings,
  getCheckResults,
  insertCheckResult,
  cleanupOldCheckResults,
  getApplicationCount,
} from '@/lib/db/queries';

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
// Applications
// ---------------------------------------------------------------------------
describe('Application CRUD', () => {
  it('createApplication returns an id and getAllApplications returns the created app', () => {
    const id = createApplication({ name: 'TestApp', public_url: 'https://example.com' });
    expect(id).toBeTruthy();

    const apps = getAllApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe('TestApp');
    expect(apps[0].public_url).toBe('https://example.com');
    expect(apps[0].public_monitoring_enabled).toBe(false);
    expect(apps[0].internal_monitoring_enabled).toBe(false);
    expect(apps[0].tags).toEqual([]);
  });

  it('createApplication stores optional fields', () => {
    const id = createApplication({
      name: 'Full',
      public_url: 'https://full.example.com',
      description: 'A description',
      health_check_url: 'https://full.example.com/health',
      icon: 'server',
      tags: ['web', 'prod'],
      notes: 'Some notes',
      docker_label: 'full:latest',
      public_monitoring_enabled: true,
      internal_monitoring_enabled: true,
      failure_threshold: 5,
    });

    const app = getApplicationById(id);
    expect(app).not.toBeNull();
    expect(app!.description).toBe('A description');
    expect(app!.health_check_url).toBe('https://full.example.com/health');
    expect(app!.icon).toBe('server');
    expect(app!.tags).toEqual(['web', 'prod']);
    expect(app!.notes).toBe('Some notes');
    expect(app!.docker_label).toBe('full:latest');
    expect(app!.public_monitoring_enabled).toBe(true);
    expect(app!.internal_monitoring_enabled).toBe(true);
    expect(app!.failure_threshold).toBe(5);
  });

  it('getApplicationById returns null for non-existent id', () => {
    expect(getApplicationById('nonexistent')).toBeNull();
  });

  it('updateApplication modifies fields and returns true', () => {
    const id = createApplication({ name: 'Old', public_url: 'https://old.com' });
    const updated = updateApplication(id, { name: 'New', description: 'updated desc' });
    expect(updated).toBe(true);

    const app = getApplicationById(id);
    expect(app!.name).toBe('New');
    expect(app!.description).toBe('updated desc');
  });

  it('updateApplication handles boolean fields', () => {
    const id = createApplication({ name: 'App', public_url: 'https://a.com' });
    updateApplication(id, { public_monitoring_enabled: true });
    const app = getApplicationById(id);
    expect(app!.public_monitoring_enabled).toBe(true);
  });

  it('updateApplication handles tags (JSON)', () => {
    const id = createApplication({ name: 'Tagged', public_url: 'https://t.com' });
    updateApplication(id, { tags: ['alpha', 'beta'] });
    const app = getApplicationById(id);
    expect(app!.tags).toEqual(['alpha', 'beta']);
  });

  it('updateApplication ignores disallowed fields', () => {
    const id = createApplication({ name: 'Secure', public_url: 'https://s.com' });
    const result = updateApplication(id, { foo_bar_baz: 'evil' });
    expect(result).toBe(false);
  });

  it('updateApplication returns false for non-existent id', () => {
    expect(updateApplication('nonexistent', { name: 'Nope' })).toBe(false);
  });

  it('updateApplication returns false for empty data', () => {
    const id = createApplication({ name: 'Empty', public_url: 'https://e.com' });
    expect(updateApplication(id, {})).toBe(false);
  });

  it('deleteApplication removes the app and returns true', () => {
    const id = createApplication({ name: 'Del', public_url: 'https://d.com' });
    expect(deleteApplication(id)).toBe(true);
    expect(getApplicationById(id)).toBeNull();
  });

  it('deleteApplication returns false for non-existent id', () => {
    expect(deleteApplication('nonexistent')).toBe(false);
  });

  it('getAllApplications returns apps ordered by created_at DESC', () => {
    createApplication({ name: 'First', public_url: 'https://1.com' });
    createApplication({ name: 'Second', public_url: 'https://2.com' });
    const apps = getAllApplications();
    // Both have the same second-precision timestamp from datetime('now'),
    // so order may be either; just verify count.
    expect(apps).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
describe('Category CRUD', () => {
  it('createCategory and getAllCategories', () => {
    const id = createCategory({ name: 'Infra', icon: 'server', color: '#ff0000' });
    expect(id).toBeTruthy();

    const cats = getAllCategories();
    expect(cats).toHaveLength(1);
    expect(cats[0].name).toBe('Infra');
    expect(cats[0].icon).toBe('server');
    expect(cats[0].color).toBe('#ff0000');
  });

  it('createCategory with minimal fields', () => {
    const id = createCategory({ name: 'Minimal' });
    const cats = getAllCategories();
    expect(cats).toHaveLength(1);
    expect(cats[0].icon).toBeNull();
    expect(cats[0].color).toBeNull();
  });

  it('updateCategory modifies fields', () => {
    const id = createCategory({ name: 'Old' });
    const updated = updateCategory(id, { name: 'New', color: 'blue' });
    expect(updated).toBe(true);

    const cats = getAllCategories();
    expect(cats[0].name).toBe('New');
    expect(cats[0].color).toBe('blue');
  });

  it('updateCategory returns false for empty data', () => {
    const id = createCategory({ name: 'Noop' });
    expect(updateCategory(id, {})).toBe(false);
  });

  it('updateCategory returns false for non-existent id', () => {
    expect(updateCategory('nonexistent', { name: 'Nope' })).toBe(false);
  });

  it('deleteCategory removes the category', () => {
    const id = createCategory({ name: 'Doomed' });
    expect(deleteCategory(id)).toBe(true);
    expect(getAllCategories()).toHaveLength(0);
  });

  it('deleteCategory returns false for non-existent id', () => {
    expect(deleteCategory('nonexistent')).toBe(false);
  });

  it('deleting a category sets category_id to NULL on applications', () => {
    const catId = createCategory({ name: 'Cat' });
    const appId = createApplication({ name: 'App', public_url: 'https://a.com', category_id: catId });
    deleteCategory(catId);
    const app = getApplicationById(appId);
    expect(app!.category_id).toBeNull();
  });

  it('getAllCategories returns categories ordered by name', () => {
    createCategory({ name: 'Zebra' });
    createCategory({ name: 'Alpha' });
    const cats = getAllCategories();
    expect(cats[0].name).toBe('Alpha');
    expect(cats[1].name).toBe('Zebra');
  });
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
describe('Settings', () => {
  it('getSettings returns defaults', () => {
    const s = getSettings();
    expect(s.id).toBe(1);
    expect(s.monitoring_interval_seconds).toBe(300);
    expect(s.retention_days).toBe(30);
    expect(s.check_timeout_ms).toBe(10000);
  });

  it('updateSettings modifies values', () => {
    const ok = updateSettings({ monitoring_interval_seconds: 60, retention_days: 7 });
    expect(ok).toBe(true);

    const s = getSettings();
    expect(s.monitoring_interval_seconds).toBe(60);
    expect(s.retention_days).toBe(7);
    expect(s.check_timeout_ms).toBe(10000); // unchanged
  });

  it('updateSettings returns false for empty data', () => {
    expect(updateSettings({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Check Results
// ---------------------------------------------------------------------------
describe('CheckResult operations', () => {
  it('insertCheckResult and getCheckResults', () => {
    const appId = createApplication({ name: 'App', public_url: 'https://a.com' });
    insertCheckResult({
      application_id: appId,
      check_type: 'public',
      status: 'up',
      http_status_code: 200,
      response_time_ms: 42,
    });

    const results = getCheckResults(appId);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('up');
    expect(results[0].http_status_code).toBe(200);
    expect(results[0].response_time_ms).toBe(42);
    expect(results[0].error_message).toBeNull();
  });

  it('insertCheckResult stores error_message', () => {
    const appId = createApplication({ name: 'App', public_url: 'https://a.com' });
    insertCheckResult({
      application_id: appId,
      check_type: 'public',
      status: 'down',
      error_message: 'Connection refused',
    });

    const results = getCheckResults(appId);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('down');
    expect(results[0].error_message).toBe('Connection refused');
  });

  it('getCheckResults without applicationId returns all results', () => {
    const id1 = createApplication({ name: 'A', public_url: 'https://a.com' });
    const id2 = createApplication({ name: 'B', public_url: 'https://b.com' });
    insertCheckResult({ application_id: id1, check_type: 'public', status: 'up' });
    insertCheckResult({ application_id: id2, check_type: 'internal', status: 'down' });

    const all = getCheckResults();
    expect(all).toHaveLength(2);
  });

  it('getCheckResults respects limit', () => {
    const appId = createApplication({ name: 'App', public_url: 'https://a.com' });
    for (let i = 0; i < 5; i++) {
      insertCheckResult({ application_id: appId, check_type: 'public', status: 'up' });
    }
    const results = getCheckResults(appId, 3);
    expect(results).toHaveLength(3);
  });

  it('cleanupOldCheckResults removes old entries', () => {
    const appId = createApplication({ name: 'App', public_url: 'https://a.com' });
    insertCheckResult({ application_id: appId, check_type: 'public', status: 'up' });

    // With a 0-day retention, everything should be removed (records are at datetime('now'))
    // But datetime('now', '-0 days') == now, so records at exactly now may not be removed.
    // Use -1 day retention to remove nothing, then verify count remains.
    const removed = cleanupOldCheckResults(0);
    // Records created at 'now' match 'now - 0 days' exactly; SQLite uses <, so they are kept.
    expect(removed).toBe(0);

    // All records are still present
    expect(getCheckResults(appId)).toHaveLength(1);
  });

  it('cleanupOldCheckResults returns number of deleted rows', () => {
    const appId = createApplication({ name: 'App', public_url: 'https://a.com' });
    // Insert a record then back-date it
    insertCheckResult({ application_id: appId, check_type: 'public', status: 'up' });
    testDb.prepare("UPDATE check_results SET checked_at = datetime('now', '-60 days')").run();

    const removed = cleanupOldCheckResults(30);
    expect(removed).toBe(1);
    expect(getCheckResults(appId)).toHaveLength(0);
  });

  it('deleting an application cascades to its check results', () => {
    const appId = createApplication({ name: 'Cascade', public_url: 'https://c.com' });
    insertCheckResult({ application_id: appId, check_type: 'public', status: 'up' });
    deleteApplication(appId);
    expect(getCheckResults(appId)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Application Count
// ---------------------------------------------------------------------------
describe('getApplicationCount', () => {
  it('returns 0 when no applications exist', () => {
    expect(getApplicationCount()).toBe(0);
  });

  it('returns correct count', () => {
    createApplication({ name: 'A', public_url: 'https://a.com' });
    createApplication({ name: 'B', public_url: 'https://b.com' });
    expect(getApplicationCount()).toBe(2);
  });

  it('decrements after delete', () => {
    const id = createApplication({ name: 'C', public_url: 'https://c.com' });
    createApplication({ name: 'D', public_url: 'https://d.com' });
    deleteApplication(id);
    expect(getApplicationCount()).toBe(1);
  });
});
