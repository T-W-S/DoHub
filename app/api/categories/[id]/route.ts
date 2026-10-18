import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { updateCategory, deleteCategory } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const ok = updateCategory(id, {
    name: body.name?.trim(),
    icon: body.icon,
    color: body.color,
  });
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const ok = deleteCategory(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
