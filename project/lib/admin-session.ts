import { createHmac, timingSafeEqual } from 'node:crypto';

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET
    || process.env.ADMIN_PASSWORD
    || 'development-only-change-me';
}

export function makeSession(username: string) {
  const payload = Buffer.from(JSON.stringify({
    username,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifySession(value?: string) {
  if (!value) return false;

  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest();
  const actual = Buffer.from(signature, 'base64url');

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return false;
  }

  try {
    const session: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof session === 'object'
      && session !== null
      && 'exp' in session
      && typeof session.exp === 'number'
      && session.exp > Date.now();
  } catch {
    return false;
  }
}
