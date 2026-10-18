import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getApplicationById, getSettings } from '@/lib/db/queries';
import { runPublicCheck, runInternalCheck } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const app = getApplicationById(id);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const settings = getSettings();
  const results: any = {};

  if (app.public_monitoring_enabled && app.public_url) {
    results.public = await runPublicCheck(app, settings.check_timeout_ms);
  }

  if (app.internal_monitoring_enabled && app.health_check_url) {
    results.internal = await runInternalCheck(app, settings.check_timeout_ms);
  }

  return NextResponse.json(results);
}
