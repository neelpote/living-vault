import type { NextRequest } from 'next/server';

export function isLocalDevelopment(request: NextRequest) {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  if (process.env.NODE_ENV !== 'development' || !host || !origin) return false;
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.host === host && parsed.protocol === 'http:';
  } catch { return false; }
}
