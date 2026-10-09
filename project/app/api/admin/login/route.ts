import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { makeSession } from '@/lib/admin-session';

function sameValue(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return firstBuffer.length === secondBuffer.length
    && timingSafeEqual(firstBuffer, secondBuffer);
}

export async function POST(request: Request) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return NextResponse.json(
      {
        message:
          'Admin credentials are not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local.',
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  if (
    typeof body !== 'object'
    || body === null
    || !('username' in body)
    || !('password' in body)
    || typeof body.username !== 'string'
    || typeof body.password !== 'string'
    || !sameValue(body.username, username)
    || !sameValue(body.password, password)
  ) {
    return NextResponse.json(
      { message: 'Incorrect username or password.' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('soham_admin', makeSession(username), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}
