import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getSettings, updateSettings } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  updateSettings({
    monitoring_interval_seconds: body.monitoring_interval_seconds,
    retention_days: body.retention_days,
    check_timeout_ms: body.check_timeout_ms,
    allowed_internal_hosts: body.allowed_internal_hosts,
  });
  return NextResponse.json({ success: true });
}
