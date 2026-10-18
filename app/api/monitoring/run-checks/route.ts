import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getAllApplications, getSettings, cleanupOldCheckResults } from '@/lib/db/queries';
import { runPublicCheck, runInternalCheck } from '@/lib/monitoring';

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
      const result = await runPublicCheck(app, settings.check_timeout_ms);
      results.push({ id: app.id, type: 'public', ...result });
    }

    if (app.internal_monitoring_enabled && app.health_check_url) {
      const result = await runInternalCheck(app, settings.check_timeout_ms);
      results.push({ id: app.id, type: 'internal', ...result });
    }
  }

  cleanupOldCheckResults(settings.retention_days);

  return NextResponse.json({ results });
}
