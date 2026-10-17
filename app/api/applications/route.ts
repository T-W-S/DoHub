import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireSetup } from '@/lib/api-helpers';
import { getAllApplications, createApplication } from '@/lib/db/queries';
import { performHealthCheck, uuid } from '@/lib/health-check';
import { getSettings, updateApplication } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const apps = getAllApplications();
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  if (!body.name?.trim() || !body.public_url?.trim()) {
    return NextResponse.json({ error: 'Name and public URL are required' }, { status: 400 });
  }

  try {
    const id = createApplication({
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      public_url: body.public_url.trim(),
      health_check_url: body.health_check_url?.trim() || undefined,
      icon: body.icon?.trim() || undefined,
      category_id: body.category_id || undefined,
      tags: body.tags || [],
      notes: body.notes?.trim() || undefined,
      docker_label: body.docker_label?.trim() || undefined,
      public_monitoring_enabled: body.public_monitoring_enabled ?? true,
      internal_monitoring_enabled: body.internal_monitoring_enabled ?? false,
      failure_threshold: body.failure_threshold ?? 3,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
