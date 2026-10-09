import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { addEnquiry } from '@/lib/backend';
import { databaseErrorResponse } from '@/lib/database';
import { sendBusinessEmail } from '@/lib/email';

export const runtime = 'nodejs';

const interests = [
  'Equipment sales',
  'Equipment servicing',
  'Product catalogue',
  'Product enquiry',
  'General enquiry',
];

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    const value: unknown = await request.json();
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid request body.');
    }
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Please submit a valid enquiry.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const interest = typeof body.interest === 'string' ? body.interest.trim() : 'General enquiry';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120 || phone.length < 7 || phone.length > 30) {
    return NextResponse.json(
      { message: 'Please enter a valid name and phone number.' },
      { status: 400 },
    );
  }

  if (
    email.length > 254
    || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    || !interests.includes(interest)
    || message.length > 3000
  ) {
    return NextResponse.json(
      { message: 'Please check your enquiry details.' },
      { status: 400 },
    );
  }

  const enquiry = {
    id: randomUUID(),
    name,
    phone,
    email,
    interest,
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    await addEnquiry(enquiry);
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }

  let notification;
  try {
    notification = await sendBusinessEmail(
      `Website enquiry: ${interest}`,
      [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email || 'Not provided'}`,
        `Interest: ${interest}`,
        '',
        'Message:',
        message || 'No additional message provided.',
      ].join('\n'),
    );
  } catch (error) {
    console.error('Failed to send enquiry notification email.', error);
    notification = { sent: false, message: 'The email notification could not be sent.' };
  }

  return NextResponse.json(
    {
      ok: true,
      message: notification.sent
        ? 'Enquiry sent successfully. We will get back to you soon.'
        : `Your enquiry was saved. ${notification.message} Please call or WhatsApp 98218 75579 for urgent help.`,
      notificationSent: notification.sent,
    },
    { status: notification.sent ? 201 : 202 },
  );
}
