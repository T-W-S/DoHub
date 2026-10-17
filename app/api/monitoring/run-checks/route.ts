import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getAllApplications, getSettings, updateApplication, insertCheckResult, cleanupOldCheckResults } from '@/lib/db/queries';
import { performHealthCheck } from '@/lib/health-check';
import type { Application } from '@/lib/db/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const settings = getSettings();
  const apps = getAllApplications();
  const results: any[] = [];

  for (const app of apps) {
    if (app.public_monitoring_enabled && app.public_url) {
      const result = await performHealthCheck(app.public_url, {
        timeoutMs: settings.check_timeout_ms,
        allowInternalHosts: settings.allowed_internal_hosts,
        allowPrivateIPs: false,
      });

      const newFailureCount = result.status === 'down' ? app.consecutive_failures + 1 : 0;
      const newStatus = newFailureCount >= app.failure_threshold ? 'down' : result.status === 'up' ? 'up' : app.last_public_status;

      updateApplication(app.id, {
        last_public_status: newStatus,
        last_public_checked_at: new Date().toISOString(),
        last_public_response_ms: result.responseTimeMs,
        last_public_http_status: result.httpStatus,
        consecutive_failures: newFailureCount,
      });

      insertCheckResult({
        application_id: app.id,
        check_type: 'public',
        status: result.status,
        http_status_code: result.httpStatus,
        response_time_ms: result.responseTimeMs,
        error_message: result.errorMessage,
      });

      results.push({ id: app.id, type: 'public', ...result });
    }

    if (app.internal_monitoring_enabled && app.health_check_url) {
      const result = await performHealthCheck(app.health_check_url, {
        timeoutMs: settings.check_timeout_ms,
        allowInternalHosts: settings.allowed_internal_hosts,
        allowPrivateIPs: true,
      });

      updateApplication(app.id, {
        last_internal_status: result.status,
        last_internal_checked_at: new Date().toISOString(),
        last_internal_response_ms: result.responseTimeMs,
        last_internal_http_status: result.httpStatus,
      });

      insertCheckResult({
        application_id: app.id,
        check_type: 'internal',
        status: result.status,
        http_status_code: result.httpStatus,
        response_time_ms: result.responseTimeMs,
        error_message: result.errorMessage,
      });

      results.push({ id: app.id, type: 'internal', ...result });
    }
  }

  // Cleanup old results based on retention setting
  cleanupOldCheckResults(settings.retention_days);

  return NextResponse.json({ results });
}
