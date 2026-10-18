import { updateApplication, insertCheckResult } from '@/lib/db/queries';
import { performHealthCheck } from '@/lib/health-check';
import type { Application } from '@/lib/db/types';

type CheckResultData = Awaited<ReturnType<typeof performHealthCheck>>;

export async function runPublicCheck(app: Application, timeoutMs: number): Promise<CheckResultData> {
  const result = await performHealthCheck(app.public_url, { timeoutMs });

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

  return result;
}

export async function runInternalCheck(app: Application, timeoutMs: number): Promise<CheckResultData> {
  const result = await performHealthCheck(app.health_check_url!, { timeoutMs });

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

  return result;
}
