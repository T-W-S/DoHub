import { NextRequest, NextResponse } from 'next/server';
import { hasAdmin, createAdmin, verifyCredentials, createSession } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({ setupRequired: !hasAdmin() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const { email, password, action } = body;

  if (action === 'setup') {
    if (hasAdmin()) {
      return NextResponse.json({ error: 'Administrator already exists' }, { status: 409 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    try {
      createAdmin(email, password);
      const token = createSession(req.headers.get('user-agent') ?? undefined);
      const res = NextResponse.json({ success: true });
      setSessionCookie(res, token);
      return res;
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  if (action === 'login') {
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    if (!verifyCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = createSession(req.headers.get('user-agent') ?? undefined);
    const res = NextResponse.json({ success: true });
    setSessionCookie(res, token);
    return res;
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
