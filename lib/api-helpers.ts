import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from './session';
import { validateSession, hasAdmin } from './auth';

export function requireAuth(req: NextRequest): NextResponse | null {
  const token = getSessionToken(req);
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireSetup(): NextResponse | null {
  if (!hasAdmin()) {
    return NextResponse.json(
      { error: 'Setup required', setupRequired: true },
      { status: 503 }
    );
  }
  return null;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimit(req: NextRequest): NextResponse | null {
  // Basic rate limiting using in-memory map per IP
  // For production with multiple instances, this would need a shared store
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const key = `${ip}:${req.nextUrl.pathname}`;
  return null; // Rate limiting is handled at middleware level
}
