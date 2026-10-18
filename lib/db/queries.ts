import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rowToApplication, rowToCategory, rowToCheckResult, rowToSettings, type Application, type Category, type CheckResult, type AppSettings } from '@/lib/db/types';

export function getAllApplications(): Application[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all() as any[];
  return rows.map(rowToApplication);
}

export function getApplicationById(id: string): Application | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  return row ? rowToApplication(row) : null;
}

export function createApplication(data: {
  name: string;
  description?: string;
  public_url: string;
  health_check_url?: string;
  icon?: string;
  category_id?: string;
  tags?: string[];
  notes?: string;
  docker_label?: string;
  public_monitoring_enabled?: boolean;
  internal_monitoring_enabled?: boolean;
  failure_threshold?: number;
}): string {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO applications (id, name, description, public_url, health_check_url, icon, category_id, tags, notes, docker_label, public_monitoring_enabled, internal_monitoring_enabled, failure_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, data.name, data.description ?? null, data.public_url, data.health_check_url ?? null,
    data.icon ?? null, data.category_id ?? null, JSON.stringify(data.tags ?? []),
    data.notes ?? null, data.docker_label ?? null,
    data.public_monitoring_enabled ? 1 : 0, data.internal_monitoring_enabled ? 1 : 0,
    data.failure_threshold ?? 3
  );
  return id;
}

export function updateApplication(id: string, data: Record<string, any>): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'name', 'description', 'public_url', 'health_check_url', 'icon', 'category_id',
    'notes', 'docker_label', 'public_monitoring_enabled', 'internal_monitoring_enabled',
    'failure_threshold', 'last_public_status', 'last_public_checked_at',
    'last_public_response_ms', 'last_public_http_status', 'last_internal_status',
    'last_internal_checked_at', 'last_internal_response_ms', 'last_internal_http_status',
    'consecutive_failures'
  ];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'tags') {
      fields.push('tags = ?');
      values.push(JSON.stringify(value));
    } else if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      if (typeof value === 'boolean') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  }

  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  const result = db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteApplication(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAllCategories(): Category[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as any[];
  return rows.map(rowToCategory);
}

export function createCategory(data: { name: string; icon?: string; color?: string }): string {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)').run(
    id, data.name, data.icon ?? null, data.color ?? null
  );
  return id;
}

export function updateCategory(id: string, data: { name?: string; icon?: string; color?: string }): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (fields.length === 0) return false;
  values.push(id);
  const result = db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteCategory(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getSettings(): AppSettings {
  const db = getDb();
  const row = db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as any;
  return rowToSettings(row);
}

export function updateSettings(data: {
  monitoring_interval_seconds?: number;
  retention_days?: number;
  check_timeout_ms?: number;
}): boolean {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.monitoring_interval_seconds !== undefined) { fields.push('monitoring_interval_seconds = ?'); values.push(data.monitoring_interval_seconds); }
  if (data.retention_days !== undefined) { fields.push('retention_days = ?'); values.push(data.retention_days); }
  if (data.check_timeout_ms !== undefined) { fields.push('check_timeout_ms = ?'); values.push(data.check_timeout_ms); }
  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  values.push(1);
  const result = db.prepare(`UPDATE app_settings SET ${fields.join(', ')} WHERE id = 1`).run(...values);
  return result.changes > 0;
}

export function getCheckResults(applicationId?: string, limit = 50): CheckResult[] {
  const db = getDb();
  const sql = applicationId
    ? 'SELECT * FROM check_results WHERE application_id = ? ORDER BY checked_at DESC LIMIT ?'
    : 'SELECT * FROM check_results ORDER BY checked_at DESC LIMIT ?';
  const rows = (applicationId
    ? db.prepare(sql).all(applicationId, limit)
    : db.prepare(sql).all(limit)) as any[];
  return rows.map(rowToCheckResult);
}

export function insertCheckResult(data: {
  application_id: string;
  check_type: 'public' | 'internal';
  status: 'up' | 'down';
  http_status_code?: number | null;
  response_time_ms?: number | null;
  error_message?: string | null;
}): void {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO check_results (id, application_id, check_type, status, http_status_code, response_time_ms, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    id, data.application_id, data.check_type, data.status,
    data.http_status_code ?? null, data.response_time_ms ?? null, data.error_message ?? null
  );
}

export function cleanupOldCheckResults(retentionDays: number): number {
  const db = getDb();
  const result = db.prepare(`DELETE FROM check_results WHERE checked_at < datetime('now', ?)`).run(`-${retentionDays} days`);
  return result.changes;
}

export function getApplicationCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  return row.count;
}
