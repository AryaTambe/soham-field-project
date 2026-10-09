import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { markOrderPaid, readOrder } from '@/lib/backend';
import { databaseErrorResponse } from '@/lib/database';
import { sendBusinessEmail } from '@/lib/email';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ message: 'Payment verification is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Please submit valid payment details.' }, { status: 400 });
  }

  if (
    !isRecord(body)
    || typeof body.razorpay_order_id !== 'string'
    || !/^order_[A-Za-z0-9]+$/.test(body.razorpay_order_id)
    || typeof body.razorpay_payment_id !== 'string'
    || !/^pay_[A-Za-z0-9]+$/.test(body.razorpay_payment_id)
    || typeof body.razorpay_signature !== 'string'
    || !/^[a-f\d]{64}$/i.test(body.razorpay_signature)
  ) {
    return NextResponse.json({ message: 'Payment details are incomplete.' }, { status: 400 });
  }

  let order;
  try {
    order = await readOrder(body.razorpay_order_id);
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
  if (!order) {
    return NextResponse.json({ message: 'The order could not be found.' }, { status: 404 });
  }

  const expectedSignature = createHmac('sha256', keySecret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest();
  const receivedSignature = Buffer.from(body.razorpay_signature, 'hex');

  if (
    expectedSignature.length !== receivedSignature.length
    || !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return NextResponse.json({ message: 'Payment signature could not be verified.' }, { status: 400 });
  }

  if (order.status === 'paid') {
    if (order.paymentId !== body.razorpay_payment_id) {
      return NextResponse.json(
        { message: 'This order has already been paid with a different payment.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, message: 'Payment has already been confirmed.' });
  }

  const authorization = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  let paymentResponse: Response;
  try {
    paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}`,
      { headers: { Authorization: authorization } },
    );
  } catch (error) {
    console.error('Could not connect to Razorpay to verify a payment.', error);
    return NextResponse.json(
      { message: 'Payment service is unreachable. Please contact us before trying again.' },
      { status: 502 },
    );
  }

  if (!paymentResponse.ok) {
    console.error('Razorpay payment lookup failed with status.', paymentResponse.status);
    return NextResponse.json(
      { message: 'We could not confirm your payment yet. Please contact us before trying again.' },
      { status: 502 },
    );
  }

  let payment: unknown;
  try {
    payment = await paymentResponse.json();
  } catch {
    return NextResponse.json(
      { message: 'We could not confirm your payment yet. Please contact us before trying again.' },
      { status: 502 },
    );
  }

  if (
    !isRecord(payment)
    || payment.order_id !== order.id
    || payment.amount !== order.amount * 100
    || payment.currency !== 'INR'
  ) {
    return NextResponse.json({ message: 'Payment details do not match this order.' }, { status: 400 });
  }

  if (payment.status === 'authorized') {
    let captureResponse: Response;
    try {
      captureResponse = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: order.amount * 100 }),
        },
      );
    } catch (error) {
      console.error('Could not connect to Razorpay to capture a payment.', error);
      return NextResponse.json(
        { message: 'Payment service is unreachable. Please contact us before trying again.' },
        { status: 502 },
      );
    }

    if (!captureResponse.ok) {
      console.error('Razorpay payment capture failed with status.', captureResponse.status);
      return NextResponse.json(
        { message: 'Your payment is not captured yet. Please contact us for help.' },
        { status: 502 },
      );
    }

    try {
      payment = await captureResponse.json();
    } catch {
      return NextResponse.json(
        { message: 'We could not confirm your payment yet. Please contact us for help.' },
        { status: 502 },
      );
    }
  }

  if (
    !isRecord(payment)
    || payment.order_id !== order.id
    || payment.amount !== order.amount * 100
    || payment.currency !== 'INR'
    || payment.status !== 'captured'
  ) {
    return NextResponse.json(
      { message: 'Your payment is still being processed. Please contact us before trying again.' },
      { status: 409 },
    );
  }

  let paidOrder;
  try {
    paidOrder = await markOrderPaid(order.id, body.razorpay_payment_id);
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
  if (!paidOrder) {
    return NextResponse.json({ message: 'The order could not be updated.' }, { status: 500 });
  }
  if (paidOrder.paymentId !== body.razorpay_payment_id) {
    return NextResponse.json(
      { message: 'This order has already been paid with a different payment.' },
      { status: 409 },
    );
  }

  let notification;
  try {
    notification = await sendBusinessEmail(
      `Payment received: ${paidOrder.productName}`,
      [
        `Product: ${paidOrder.productName}`,
        `Amount: INR ${paidOrder.amount.toLocaleString('en-IN')}`,
        `Payment ID: ${body.razorpay_payment_id}`,
        `Customer: ${paidOrder.customer.name}`,
        `Phone: ${paidOrder.customer.phone}`,
        `Email: ${paidOrder.customer.email}`,
        `Delivery address: ${[
          paidOrder.customer.addressLine1,
          paidOrder.customer.addressLine2,
          paidOrder.customer.city,
          paidOrder.customer.state,
          paidOrder.customer.pincode,
        ].filter(Boolean).join(', ')}`,
      ].join('\n'),
    );
  } catch (error) {
    console.error('Failed to send payment notification email.', error);
    notification = { sent: false };
  }

  return NextResponse.json({
    ok: true,
    message: notification.sent
      ? 'Payment successful. Your order has been placed.'
      : 'Payment successful and order saved. Email notification could not be sent; we will follow up using your contact details.',
  });
}
