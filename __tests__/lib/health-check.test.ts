import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { performHealthCheck, safeParseURL, uuid } from '@/lib/health-check';

// ---------------------------------------------------------------------------
// safeParseURL
// ---------------------------------------------------------------------------
describe('safeParseURL', () => {
  it('returns a URL for a valid https URL', () => {
    const result = safeParseURL('https://example.com');
    expect(result).toBeInstanceOf(URL);
    expect(result!.hostname).toBe('example.com');
  });

  it('returns a URL for a valid http URL', () => {
    const result = safeParseURL('http://example.com');
    expect(result).toBeInstanceOf(URL);
  });

  it('returns null for ftp protocol', () => {
    expect(safeParseURL('ftp://example.com')).toBeNull();
  });

  it('returns null for javascript protocol', () => {
    expect(safeParseURL('javascript:alert(1)')).toBeNull();
  });

  it('returns null for file protocol', () => {
    expect(safeParseURL('file:///etc/passwd')).toBeNull();
  });

  it('returns null for data protocol', () => {
    expect(safeParseURL('data:text/html,<h1>Hi</h1>')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(safeParseURL('not-a-url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(safeParseURL('')).toBeNull();
  });

  it('rejects URLs with username (userinfo)', () => {
    expect(safeParseURL('https://admin@example.com')).toBeNull();
  });

  it('rejects URLs with username and password', () => {
    expect(safeParseURL('https://admin:password@example.com')).toBeNull();
  });

  it('allows URLs with port numbers', () => {
    const result = safeParseURL('https://example.com:8443');
    expect(result).not.toBeNull();
    expect(result!.port).toBe('8443');
  });

  it('allows URLs with paths', () => {
    const result = safeParseURL('https://example.com/health');
    expect(result).not.toBeNull();
    expect(result!.pathname).toBe('/health');
  });

  it('allows URLs with query strings', () => {
    const result = safeParseURL('https://example.com/path?key=value');
    expect(result).not.toBeNull();
    expect(result!.search).toBe('?key=value');
  });
});

// ---------------------------------------------------------------------------
// performHealthCheck
// ---------------------------------------------------------------------------
describe('performHealthCheck', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns "up" for a 200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 200 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('up');
    expect(result.httpStatus).toBe(200);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.errorMessage).toBeNull();
  });

  it('returns "up" for a 301 redirect (manual mode)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 301 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('up');
    expect(result.httpStatus).toBe(301);
  });

  it('returns "up" for a 204 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 204 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('up');
    expect(result.httpStatus).toBe(204);
  });

  it('returns "down" for a 500 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 500 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.httpStatus).toBe(500);
    expect(result.errorMessage).toBe('HTTP 500');
  });

  it('returns "down" for a 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 404 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.httpStatus).toBe(404);
    expect(result.errorMessage).toBe('HTTP 404');
  });

  it('returns "down" for a 403 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 403 })
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.httpStatus).toBe(403);
    expect(result.errorMessage).toBe('HTTP 403');
  });

  it('returns "down" with timeout message on AbortError', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(abortError)
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.httpStatus).toBeNull();
    expect(result.errorMessage).toBe('Request timed out');
  });

  it('returns "down" with error message on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND example.com'))
    );

    const result = await performHealthCheck('https://example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.httpStatus).toBeNull();
    expect(result.errorMessage).toBe('getaddrinfo ENOTFOUND example.com');
  });

  it('returns "down" for invalid URL', async () => {
    const result = await performHealthCheck('not-a-url', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.errorMessage).toBe('Invalid URL');
    expect(result.httpStatus).toBeNull();
    expect(result.responseTimeMs).toBeNull();
  });

  it('returns "down" for non-http protocol', async () => {
    const result = await performHealthCheck('ftp://files.example.com', { timeoutMs: 5000 });
    expect(result.status).toBe('down');
    expect(result.errorMessage).toBe('Invalid URL');
  });

  it('passes correct options to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', mockFetch);

    await performHealthCheck('https://example.com/health', { timeoutMs: 3000 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.com/health');
    expect(opts.redirect).toBe('manual');
    expect(opts.headers).toEqual({ 'User-Agent': 'DockerHub-HealthCheck/1.0' });
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it('does not call fetch for an invalid URL', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    await performHealthCheck('javascript:alert(1)', { timeoutMs: 5000 });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// uuid
// ---------------------------------------------------------------------------
describe('uuid', () => {
  it('returns a valid UUID v4 string', () => {
    const id = uuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('returns unique values on successive calls', () => {
    const a = uuid();
    const b = uuid();
    expect(a).not.toBe(b);
  });
});
