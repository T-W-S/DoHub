import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { randomUUID } from 'crypto';

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
];

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 0) return true;
  return PRIVATE_IP_RANGES.some((re) => re.test(ip));
}

function isAllowedInternalHost(host: string, allowlist: string[]): boolean {
  const normalized = host.toLowerCase();
  return allowlist.some((h) => h.toLowerCase() === normalized);
}

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
    allowInternalHosts: string[];
    allowPrivateIPs: boolean;
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

  const hostname = parsed.hostname;

  // DNS resolution to validate the IP isn't a SSRF target
  let resolvedIPs: string[];
  try {
    const records = await lookup(hostname, { all: true });
    resolvedIPs = records.map((r) => r.address);
  } catch {
    return {
      status: 'down',
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: `DNS resolution failed for ${hostname}`,
    };
  }

  if (resolvedIPs.length === 0) {
    return {
      status: 'down',
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: `No DNS records for ${hostname}`,
    };
  }

  const hasPrivateIP = resolvedIPs.some(isPrivateIP);

  if (hasPrivateIP && !options.allowPrivateIPs) {
    // Check if the host is in the internal allowlist
    if (!isAllowedInternalHost(hostname, options.allowInternalHosts)) {
      return {
        status: 'down',
        httpStatus: null,
        responseTimeMs: null,
        errorMessage: `Host ${hostname} resolves to a private IP and is not in the allowlist`,
      };
    }
  } else if (hasPrivateIP && options.allowPrivateIPs) {
    // Even with allowPrivateIPs, require the allowlist for internal hosts
    if (!isAllowedInternalHost(hostname, options.allowInternalHosts)) {
      return {
        status: 'down',
        httpStatus: null,
        responseTimeMs: null,
        errorMessage: `Host ${hostname} resolves to a private IP and is not in the allowlist`,
      };
    }
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

export type HealthCheckOptions = {
  timeoutMs: number;
  allowInternalHosts: string[];
  allowPrivateIPs: boolean;
};

export { safeParseURL, isPrivateIP, isAllowedInternalHost };

export function uuid(): string {
  return randomUUID();
}
