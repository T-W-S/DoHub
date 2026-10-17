import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getApplicationById, updateApplication, deleteApplication } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const existing = getApplicationById(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = true;
  if (updated) {
    updateApplication(params.id, {
      name: body.name?.trim() ?? existing.name,
      description: body.description ?? existing.description,
      public_url: body.public_url?.trim() ?? existing.public_url,
      health_check_url: body.health_check_url ?? existing.health_check_url,
      icon: body.icon ?? existing.icon,
      category_id: body.category_id ?? existing.category_id,
      tags: body.tags ?? existing.tags,
      notes: body.notes ?? existing.notes,
      docker_label: body.docker_label ?? existing.docker_label,
      public_monitoring_enabled: body.public_monitoring_enabled ?? existing.public_monitoring_enabled,
      internal_monitoring_enabled: body.internal_monitoring_enabled ?? existing.internal_monitoring_enabled,
      failure_threshold: body.failure_threshold ?? existing.failure_threshold,
    });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'No changes' }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const deleted = deleteApplication(params.id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
