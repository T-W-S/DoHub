import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'dh_session';

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete(SESSION_COOKIE);
}

export function getSessionToken(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export function isAuthenticated(req: NextRequest): boolean {
  const token = getSessionToken(req);
  if (!token) return false;
  // Defer to lib/auth for DB-backed validation
  // Lazy import to avoid issues with middleware module scope
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { validateSession } = require('./auth');
  return validateSession(token);
}
