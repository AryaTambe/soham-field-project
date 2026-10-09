import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  decideServiceBooking,
  markServiceBookingCustomerNotified,
  readServiceBooking,
} from '@/lib/backend';
import { verifySession } from '@/lib/admin-session';
import { databaseErrorResponse } from '@/lib/database';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get('soham_admin')?.value);
}

export async function POST(request: Request) {
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
    || !('action' in body)
    || (
      body.action !== 'accept'
      && body.action !== 'reject'
      && body.action !== 'resend-confirmation'
    )
  ) {
    return NextResponse.json(
      { message: 'A service request id and valid action are required.' },
      { status: 400 },
    );
  }

  const { id, action } = body;

  try {
    let booking = await readServiceBooking(id);
    if (!booking) {
      return NextResponse.json({ message: 'Service request not found.' }, { status: 404 });
    }

    if (action === 'reject') {
      if (booking.status !== 'pending') {
        return NextResponse.json(
          { message: 'Only pending service requests can be rejected.' },
          { status: 409 },
        );
      }
      booking = await decideServiceBooking(id, 'rejected');
      if (!booking) {
        return NextResponse.json(
          { message: 'The request was updated by another admin. Refresh and try again.' },
          { status: 409 },
        );
      }

      return NextResponse.json({
        ok: true,
        status: booking.status,
        notificationSent: false,
        message: 'Service request rejected. No email was sent to the customer.',
      });
    }

    if (booking.status === 'rejected') {
      return NextResponse.json(
        { message: 'A rejected service request cannot be accepted.' },
        { status: 409 },
      );
    }
    if (action === 'resend-confirmation' && booking.status !== 'accepted') {
      return NextResponse.json(
        { message: 'Only accepted service requests can resend a confirmation email.' },
        { status: 409 },
      );
    }
    if (!booking.email) {
      return NextResponse.json(
        { message: 'This request has no customer email address, so it cannot be accepted by email.' },
        { status: 400 },
      );
    }

    if (booking.status === 'pending') {
      const accepted = await decideServiceBooking(id, 'accepted');
      if (!accepted) {
        return NextResponse.json(
          { message: 'The request was updated by another admin. Refresh and try again.' },
          { status: 409 },
        );
      }
      booking = accepted;
    }

    if (booking.customerNotifiedAt) {
      return NextResponse.json({
        ok: true,
        status: booking.status,
        notificationSent: true,
        message: 'This request is already accepted and the confirmation email was sent.',
      });
    }

    let notification;
    try {
      notification = await sendEmail(
        booking.email,
        'Your Soham Surgical repair request is accepted',
        [
          `Hello ${booking.name},`,
          '',
          'Your repair service request has been accepted.',
          `Product: ${booking.productName}`,
          `Preferred date: ${booking.preferredDate}`,
          `Preferred time: ${booking.preferredTime}`,
          `Service address: ${booking.address}`,
          '',
          'Our team will contact you if any further details are needed.',
          '',
          'Soham Surgical',
          'Phone / WhatsApp: 9821875579',
        ].join('\n'),
      );
    } catch (error) {
      console.error('Failed to send service acceptance confirmation.', error);
      notification = { sent: false };
    }

    if (!notification.sent) {
      return NextResponse.json(
        {
          ok: true,
          status: booking.status,
          notificationSent: false,
          message: 'Request accepted, but the confirmation email could not be sent. Configure SMTP or retry the email.',
        },
        { status: 202 },
      );
    }

    await markServiceBookingCustomerNotified(id);
    return NextResponse.json({
      ok: true,
      status: booking.status,
      notificationSent: true,
      message: `Request accepted. Confirmation email sent to ${booking.email}.`,
    });
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
