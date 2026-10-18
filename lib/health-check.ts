import { randomUUID } from 'crypto';

type CheckResultData = {
  status: 'up' | 'down';
  httpStatus: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
};

export async function performHealthCheck(
  url: string,
  options: {
    timeoutMs: number;
  }
): Promise<CheckResultData> {
  const parsed = safeParseURL(url);
  if (!parsed) {
    return {
      status: 'down',
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: 'Invalid URL',
    };
  }

  // Perform the HTTP request with no redirects allowed
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
  const startTime = Date.now();

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': 'DockerHub-HealthCheck/1.0' },
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    // 2xx and 3xx (except redirects to private IPs) are "up"
    // Redirects are not followed (redirect: manual), so 3xx means we stopped
    if (res.status >= 200 && res.status < 400) {
      return {
        status: 'up',
        httpStatus: res.status,
        responseTimeMs,
        errorMessage: null,
      };
    }

    // 4xx and 5xx are "down"
    return {
      status: 'down',
      httpStatus: res.status,
      responseTimeMs,
      errorMessage: `HTTP ${res.status}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    return {
      status: 'down',
      httpStatus: null,
      responseTimeMs,
      errorMessage: isTimeout ? 'Request timed out' : err.message,
    };
  }
}

function safeParseURL(url: string): URL | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    // Block userinfo (credentials in URL)
    if (parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export { safeParseURL };

export function uuid(): string {
  return randomUUID();
}
