import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { getAllCategories, createCategory } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;
  return NextResponse.json(getAllCategories());
}

export async function POST(req: NextRequest) {
  const authErr = requireAuth(req);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  const id = createCategory({
    name: body.name.trim(),
    icon: body.icon?.trim() || undefined,
    color: body.color?.trim() || undefined,
  });
  return NextResponse.json({ id }, { status: 201 });
}
