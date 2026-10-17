import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getCheckResults, getAllApplications } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const url = new URL(req.url);
  const appId = url.searchParams.get('appId');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const results = getCheckResults(appId ?? undefined, limit);
  const apps = getAllApplications();
  const appMap = new Map(apps.map(a => [a.id, a.name]));

  const withNames = results.map(r => ({
    ...r,
    application_name: appMap.get(r.application_id) ?? 'Unknown',
  }));

  return NextResponse.json(withNames);
}
