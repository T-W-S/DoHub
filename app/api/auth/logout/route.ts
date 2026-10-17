import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { clearSessionCookie, getSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = getSessionToken(req);
  if (token) destroySession(token);
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
