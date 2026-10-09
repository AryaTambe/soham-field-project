import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { addOrder, type CustomerDetails } from '@/lib/backend';
import { databaseErrorResponse, isDatabaseConfigured } from '@/lib/database';
import { categories, products, type CategoryKey } from '@/lib/products';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCustomer(value: unknown): CustomerDetails | undefined {
  if (!isRecord(value)) return undefined;
  const customer = {
    name: typeof value.name === 'string' ? value.name.trim() : '',
    phone: typeof value.phone === 'string' ? value.phone.trim() : '',
    email: typeof value.email === 'string' ? value.email.trim() : '',
    addressLine1: typeof value.addressLine1 === 'string' ? value.addressLine1.trim() : '',
    addressLine2: typeof value.addressLine2 === 'string' ? value.addressLine2.trim() : '',
    city: typeof value.city === 'string' ? value.city.trim() : '',
    state: typeof value.state === 'string' ? value.state.trim() : '',
    pincode: typeof value.pincode === 'string' ? value.pincode.trim() : '',
  };

  const valid = customer.name.length >= 2 && customer.name.length <= 120
    && customer.phone.length >= 7 && customer.phone.length <= 30
    && customer.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
    && customer.addressLine1.length >= 5 && customer.addressLine1.length <= 200
    && customer.addressLine2.length <= 200
    && customer.city.length > 0 && customer.city.length <= 100
    && customer.state.length > 0 && customer.state.length <= 100
    && /^\d{6}$/.test(customer.pincode);

  return valid ? customer : undefined;
}

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: 'Online payments are not configured yet. Please contact us to place your order.' },
      { status: 503 },
    );
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { message: 'The order database is not configured yet. Please contact us to place your order.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Please submit a valid order.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.category !== 'string' || typeof body.productName !== 'string') {
    return NextResponse.json({ message: 'A valid product is required.' }, { status: 400 });
  }

  if (!Object.hasOwn(categories, body.category)) {
    return NextResponse.json({ message: 'The selected product category was not found.' }, { status: 404 });
  }

  const category = body.category as CategoryKey;
  const product = products[category].find(item => item.name === body.productName);
  if (!product) {
    return NextResponse.json({ message: 'The selected product was not found.' }, { status: 404 });
  }

  const customer = parseCustomer(body.customer);
  if (!customer) {
    return NextResponse.json(
      { message: 'Please provide valid contact and delivery details.' },
      { status: 400 },
    );
  }

  const receipt = randomUUID();
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  let razorpayResponse: Response;
  try {
    razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: product.price * 100,
        currency: 'INR',
        receipt,
        notes: {
          product: product.name,
          customer: customer.name,
          phone: customer.phone,
        },
      }),
    });
  } catch (error) {
    console.error('Could not connect to Razorpay to create an order.', error);
    return NextResponse.json(
      { message: 'Payment service is unreachable. Please try again or contact us.' },
      { status: 502 },
    );
  }

  if (!razorpayResponse.ok) {
    console.error('Razorpay order creation failed with status.', razorpayResponse.status);
    return NextResponse.json(
      { message: 'We could not start the payment. Please try again or contact us.' },
      { status: 502 },
    );
  }

  let razorpayOrder: unknown;
  try {
    razorpayOrder = await razorpayResponse.json();
  } catch {
    console.error('Razorpay returned an unreadable order response.');
    return NextResponse.json(
      { message: 'We could not start the payment. Please try again or contact us.' },
      { status: 502 },
    );
  }
  if (!isRecord(razorpayOrder) || typeof razorpayOrder.id !== 'string') {
    console.error('Razorpay returned an invalid order response.');
    return NextResponse.json(
      { message: 'We could not start the payment. Please try again or contact us.' },
      { status: 502 },
    );
  }

  try {
    await addOrder({
      id: razorpayOrder.id,
      productName: product.name,
      category,
      amount: product.price,
      customer,
      status: 'created',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    const failure = databaseErrorResponse(error);
    return NextResponse.json(
      { message: `The payment order was created, but could not be saved. ${failure.message}` },
      { status: failure.status },
    );
  }

  return NextResponse.json({
    orderId: razorpayOrder.id,
    keyId,
    amount: product.price * 100,
    productName: product.name,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });
}
