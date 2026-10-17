import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getApplicationById, getSettings, updateApplication, insertCheckResult } from '@/lib/db/queries';
import { performHealthCheck } from '@/lib/health-check';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const app = getApplicationById(params.id);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const settings = getSettings();
  const results: any = {};

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

    results.public = result;
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

    results.internal = result;
  }

  return NextResponse.json(results);
}
