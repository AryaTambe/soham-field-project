import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  readEnquiries,
  readOrders,
  readServiceBookings,
  removeEnquiry,
} from '@/lib/backend';
import { verifySession } from '@/lib/admin-session';
import { databaseErrorResponse } from '@/lib/database';

export const runtime = 'nodejs';

async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get('soham_admin')?.value);
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [enquiries, serviceBookings, orders] = await Promise.all([
      readEnquiries(),
      readServiceBookings(),
      readOrders(),
    ]);

    return NextResponse.json({ enquiries, serviceBookings, orders });
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
    || !('id' in body)
    || typeof body.id !== 'string'
    || !body.id
  ) {
    return NextResponse.json({ message: 'An enquiry id is required.' }, { status: 400 });
  }

  try {
    if (!await removeEnquiry(body.id)) {
      return NextResponse.json({ message: 'Enquiry not found.' }, { status: 404 });
    }
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }

  return NextResponse.json({ ok: true });
}
