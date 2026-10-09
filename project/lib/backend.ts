import { databaseRequest } from '@/lib/database';

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
  createdAt: string;
};

export type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

export type PurchaseOrder = {
  id: string;
  productName: string;
  category: string;
  amount: number;
  customer: CustomerDetails;
  status: 'created' | 'paid';
  paymentId?: string;
  createdAt: string;
  paidAt?: string;
};

export type ServiceBooking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  productName: string;
  issue: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  status: 'pending' | 'accepted' | 'rejected';
  customerNotifiedAt?: string;
  createdAt: string;
};

type EnquiryRow = Omit<Enquiry, 'createdAt'> & { created_at: string };
type ServiceBookingRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  product_name: string;
  issue: string;
  preferred_date: string;
  preferred_time: string;
  address: string;
  status: ServiceBooking['status'];
  customer_notified_at: string | null;
  created_at: string;
};
type OrderRow = {
  razorpay_order_id: string;
  product_name: string;
  category: string;
  amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  status: PurchaseOrder['status'];
  payment_id: string | null;
  created_at: string;
  paid_at: string | null;
};

function orderFromRow(row: OrderRow): PurchaseOrder {
  return {
    id: row.razorpay_order_id,
    productName: row.product_name,
    category: row.category,
    amount: row.amount,
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
    },
    status: row.status,
    ...(row.payment_id ? { paymentId: row.payment_id } : {}),
    createdAt: row.created_at,
    ...(row.paid_at ? { paidAt: row.paid_at } : {}),
  };
}

export async function readEnquiries(): Promise<Enquiry[]> {
  const query = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
  });
  const rows = await databaseRequest<EnquiryRow[]>('enquiries', query);

  return rows.map(({ created_at, ...enquiry }) => ({
    ...enquiry,
    createdAt: created_at,
  }));
}

export async function addEnquiry(enquiry: Enquiry) {
  const query = new URLSearchParams();
  const row: EnquiryRow = {
    id: enquiry.id,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    interest: enquiry.interest,
    message: enquiry.message,
    created_at: enquiry.createdAt,
  };

  const inserted = await databaseRequest<EnquiryRow[]>('enquiries', query, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (inserted.length !== 1) throw new Error('The enquiry was not saved.');
}

export async function removeEnquiry(id: string) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    select: 'id',
  });
  const removed = await databaseRequest<Array<{ id: string }>>('enquiries', query, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });

  return removed.length > 0;
}

export async function readOrders(): Promise<PurchaseOrder[]> {
  const query = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
  });
  const rows = await databaseRequest<OrderRow[]>('orders', query);

  return rows.map(orderFromRow);
}

export async function readOrder(id: string): Promise<PurchaseOrder | undefined> {
  const query = new URLSearchParams({
    select: '*',
    razorpay_order_id: `eq.${id}`,
    limit: '1',
  });
  const rows = await databaseRequest<OrderRow[]>('orders', query);
  return rows[0] ? orderFromRow(rows[0]) : undefined;
}

export async function addOrder(order: PurchaseOrder) {
  const query = new URLSearchParams();
  const row: OrderRow = {
    razorpay_order_id: order.id,
    product_name: order.productName,
    category: order.category,
    amount: order.amount,
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    customer_email: order.customer.email,
    address_line1: order.customer.addressLine1,
    address_line2: order.customer.addressLine2,
    city: order.customer.city,
    state: order.customer.state,
    pincode: order.customer.pincode,
    status: order.status,
    payment_id: order.paymentId ?? null,
    created_at: order.createdAt,
    paid_at: order.paidAt ?? null,
  };

  const inserted = await databaseRequest<OrderRow[]>('orders', query, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (inserted.length !== 1) throw new Error('The order was not saved.');
}

export async function markOrderPaid(id: string, paymentId: string) {
  const query = new URLSearchParams({
    razorpay_order_id: `eq.${id}`,
    status: 'eq.created',
    select: '*',
  });
  const rows = await databaseRequest<OrderRow[]>('orders', query, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'paid',
      payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }),
  });

  return rows[0] ? orderFromRow(rows[0]) : readOrder(id);
}

export async function readServiceBookings(): Promise<ServiceBooking[]> {
  const query = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
  });
  const rows = await databaseRequest<ServiceBookingRow[]>('service_bookings', query);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    productName: row.product_name,
    issue: row.issue,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    address: row.address,
    status: row.status,
    ...(row.customer_notified_at
      ? { customerNotifiedAt: row.customer_notified_at }
      : {}),
    createdAt: row.created_at,
  }));
}

export async function readServiceBooking(id: string) {
  const query = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });
  const rows = await databaseRequest<ServiceBookingRow[]>('service_bookings', query);
  const row = rows[0];
  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    productName: row.product_name,
    issue: row.issue,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    address: row.address,
    status: row.status,
    ...(row.customer_notified_at
      ? { customerNotifiedAt: row.customer_notified_at }
      : {}),
    createdAt: row.created_at,
  } satisfies ServiceBooking;
}

export async function decideServiceBooking(
  id: string,
  status: Extract<ServiceBooking['status'], 'accepted' | 'rejected'>,
) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    status: 'eq.pending',
    select: '*',
  });
  const rows = await databaseRequest<ServiceBookingRow[]>('service_bookings', query, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status }),
  });

  return rows[0] ? readServiceBooking(id) : undefined;
}

export async function markServiceBookingCustomerNotified(id: string) {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    status: 'eq.accepted',
    customer_notified_at: 'is.null',
    select: 'id',
  });
  const rows = await databaseRequest<Array<{ id: string }>>(
    'service_bookings',
    query,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ customer_notified_at: new Date().toISOString() }),
    },
  );

  return rows.length > 0;
}

export async function addServiceBooking(booking: ServiceBooking) {
  const query = new URLSearchParams();
  const row: ServiceBookingRow = {
    id: booking.id,
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    product_name: booking.productName,
    issue: booking.issue,
    preferred_date: booking.preferredDate,
    preferred_time: booking.preferredTime,
    address: booking.address,
    status: 'pending',
    customer_notified_at: null,
    created_at: booking.createdAt,
  };

  const inserted = await databaseRequest<ServiceBookingRow[]>('service_bookings', query, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (inserted.length !== 1) throw new Error('The service request was not saved.');
}
