import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { addServiceBooking } from '@/lib/backend';
import { databaseErrorResponse } from '@/lib/database';
import { sendBusinessEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    const value: unknown = await request.json();
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid request body.');
    }
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Please submit a valid service request.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const productName = typeof body.productName === 'string' ? body.productName.trim() : '';
  const issue = typeof body.issue === 'string' ? body.issue.trim() : '';
  const preferredDate = typeof body.preferredDate === 'string' ? body.preferredDate.trim() : '';
  const preferredTime = typeof body.preferredTime === 'string' ? body.preferredTime.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';

  if (
    name.length < 2 || name.length > 120
    || phone.length < 7 || phone.length > 30
    || productName.length < 2 || productName.length > 160
    || issue.length < 5 || issue.length > 3000
    || address.length < 5 || address.length > 500
    || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    || Number.isNaN(Date.parse(`${preferredDate}T00:00:00`))
    || preferredDate < new Date().toISOString().slice(0, 10)
    || preferredTime.length < 3 || preferredTime.length > 40
    || email.length > 254
    || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return NextResponse.json(
      { message: 'Please check all required service booking details.' },
      { status: 400 },
    );
  }

  const booking = {
    id: randomUUID(),
    name,
    phone,
    email,
    productName,
    issue,
    preferredDate,
    preferredTime,
    address,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  try {
    await addServiceBooking(booking);
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }

  let notification;
  try {
    notification = await sendBusinessEmail(
      `Repair service request: ${productName}`,
      [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email || 'Not provided'}`,
        `Product: ${productName}`,
        `Preferred date: ${preferredDate}`,
        `Preferred time: ${preferredTime}`,
        `Service address: ${address}`,
        '',
        'Reported issue:',
        issue,
      ].join('\n'),
    );
  } catch (error) {
    console.error('Failed to send repair service notification email.', error);
    notification = { sent: false, message: 'The email notification could not be sent.' };
  }

  return NextResponse.json(
    {
      ok: true,
      message: notification.sent
        ? 'Service request received. Our team will contact you to confirm the appointment.'
        : `Your service request was saved. ${notification.message} Please call or WhatsApp 98218 75579 to confirm.`,
      notificationSent: notification.sent,
    },
    { status: notification.sent ? 201 : 202 },
  );
}
