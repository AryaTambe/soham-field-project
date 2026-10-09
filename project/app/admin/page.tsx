'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
  createdAt: string;
};

type ServiceBooking = {
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

type PurchaseOrder = {
  id: string;
  productName: string;
  amount: number;
  status: 'created' | 'paid';
  paymentId?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  paidAt?: string;
};

type DashboardData = {
  enquiries: Enquiry[];
  serviceBookings: ServiceBooking[];
  orders: PurchaseOrder[];
};

const emptyDashboard: DashboardData = {
  enquiries: [],
  serviceBookings: [],
  orders: [],
};

const demoDashboard: DashboardData = {
  enquiries: [
    {
      id: 'demo-enquiry-1',
      name: 'Sample Customer',
      phone: '00000 00001',
      email: 'customer@example.invalid',
      interest: 'TENS 5000',
      message: 'Sample enquiry asking about product availability and delivery.',
      createdAt: '2026-10-08T10:30:00.000Z',
    },
    {
      id: 'demo-enquiry-2',
      name: 'Example Clinic',
      phone: '00000 00002',
      email: 'clinic@example.invalid',
      interest: 'Treatment Table',
      message: 'Sample enquiry asking about clinic pricing.',
      createdAt: '2026-10-07T08:15:00.000Z',
    },
  ],
  serviceBookings: [
    {
      id: 'demo-service-1',
      name: 'Sample Customer',
      phone: '00000 00003',
      email: 'repair@example.invalid',
      productName: 'Ultrasound Therapy 1MHz',
      issue: 'Sample repair request: device needs inspection.',
      preferredDate: '2026-10-12',
      preferredTime: '10:00–12:00',
      address: 'Example address, Sample City',
      status: 'pending',
      createdAt: '2026-10-06T11:45:00.000Z',
    },
  ],
  orders: [
    {
      id: 'DEMO-ORDER-1001',
      productName: 'TENS 5000',
      amount: 4999,
      status: 'paid',
      paymentId: 'DEMO-PAYMENT-1001',
      customer: {
        name: 'Sample Customer',
        phone: '00000 00004',
        email: 'buyer@example.invalid',
        addressLine1: 'Example Street 1',
        addressLine2: '',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '000000',
      },
      createdAt: '2026-10-08T09:00:00.000Z',
      paidAt: '2026-10-08T09:02:00.000Z',
    },
    {
      id: 'DEMO-ORDER-1002',
      productName: 'Rehab Exercise Ball',
      amount: 899,
      status: 'paid',
      paymentId: 'DEMO-PAYMENT-1002',
      customer: {
        name: 'Example Clinic',
        phone: '00000 00005',
        email: 'clinic@example.invalid',
        addressLine1: 'Example Street 2',
        addressLine2: '',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '000000',
      },
      createdAt: '2026-10-05T13:20:00.000Z',
      paidAt: '2026-10-05T13:23:00.000Z',
    },
    {
      id: 'DEMO-ORDER-1003',
      productName: 'Treatment Table',
      amount: 12000,
      status: 'created',
      customer: {
        name: 'Sample Clinic',
        phone: '00000 00006',
        email: 'orders@example.invalid',
        addressLine1: 'Example Street 3',
        addressLine2: '',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '000000',
      },
      createdAt: '2026-10-04T07:30:00.000Z',
    },
  ],
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);

  async function loadDashboard() {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/enquiries', { cache: 'no-store' });
      if (response.status === 401) {
        setIsLoggedIn(false);
        setDashboard(emptyDashboard);
        setIsDemoMode(false);
        return false;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Could not load admin data.');
      }

      setDashboard({
        enquiries: result.enquiries || [],
        serviceBookings: result.serviceBookings || [],
        orders: result.orders || [],
      });
      setIsLoggedIn(true);
      return true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load admin data.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed.');

      if (!await loadDashboard()) {
        setError('Signed in, but the live dashboard could not be loaded. Please try refreshing.');
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    }
  }

  async function logout() {
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Could not end your admin session.');
      setIsLoggedIn(false);
      setDashboard(emptyDashboard);
      setIsDemoMode(false);
      setError('');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Could not log out.');
    }
  }

  async function removeEnquiry(id: string) {
    if (!confirm('Delete this enquiry?')) return;

    try {
      const response = await fetch('/api/admin/enquiries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not delete enquiry.');
      setDashboard(current => ({
        ...current,
        enquiries: current.enquiries.filter(enquiry => enquiry.id !== id),
      }));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete enquiry.');
    }
  }

  async function updateServiceBooking(
    id: string,
    action: 'accept' | 'reject' | 'resend-confirmation',
  ) {
    setUpdatingServiceId(id);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/admin/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not update service request.');

      setNotice(result.message || 'Service request updated.');
      await loadDashboard();
    } catch (updateError) {
      setError(updateError instanceof Error
        ? updateError.message
        : 'Could not update service request.');
    } finally {
      setUpdatingServiceId(null);
    }
  }

  const visibleDashboard = isDemoMode ? demoDashboard : dashboard;
  const paidOrders = visibleDashboard.orders.filter(order => order.status === 'paid');
  const totalRevenue = paidOrders.reduce((total, order) => total + order.amount, 0);
  const salesByProduct = paidOrders.reduce<
    Record<string, { units: number; revenue: number }>
  >((sales, order) => {
    const productSales = sales[order.productName] ?? { units: 0, revenue: 0 };
    productSales.units += 1;
    productSales.revenue += order.amount;
    sales[order.productName] = productSales;
    return sales;
  }, {});

  return (
    <div className="admin-page">
      <div className="admin-wrap">
        <a className="back-link" href="/">← Back to website</a>
        <h1 className="admin-title">Soham Surgical <span>Dashboard</span></h1>

        {!isLoggedIn ? (
          <form className="admin-card admin-login" onSubmit={login}>
            <h2>Admin Login</h2>
            <p className="muted">Sign in to view live orders, enquiries, and repair requests.</p>
            <label>
              Username
              <input autoComplete="username" name="username" required type="text" />
            </label>
            <label>
              Password
              <input autoComplete="current-password" name="password" required type="password" />
            </label>
            <button className="btn btn-primary" disabled={isLoading} type="submit">
              {isLoading ? 'Signing in…' : 'Login'}
            </button>
            {error && <p aria-live="polite" className="error">{error}</p>}
            <p className="muted">
              Admin credentials are configured privately in the server environment.
            </p>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <span>
                {isDemoMode
                  ? 'Demo preview · fictional sample data'
                  : isLoading
                    ? 'Updating dashboard…'
                    : 'Connected to your business database'}
              </span>
              <div>
                <button
                  className="btn btn-outline"
                  onClick={() => setIsDemoMode(current => !current)}
                  type="button"
                >
                  {isDemoMode ? 'Back to live data' : 'Preview sample data'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={isLoading}
                  onClick={() => void loadDashboard()}
                  type="button"
                >
                  Refresh data
                </button>
                <button className="btn btn-danger" onClick={() => void logout()} type="button">
                  Logout
                </button>
              </div>
            </div>
            {isDemoMode && (
              <div className="admin-card" role="status">
                <strong>Sample data preview.</strong> These fictional records are for presentation
                only. They are not stored in Supabase and do not affect real totals.
              </div>
            )}
            {notice && <div className="admin-card" role="status">{notice}</div>}
            {error && <div aria-live="polite" className="admin-card error">{error}</div>}
            <section aria-label="Business overview" className="dashboard-stats">
              <article className="stat-card stat-revenue">
                <span>Revenue collected</span>
                <strong>{formatCurrency(totalRevenue)}</strong>
                <small>From {paidOrders.length} paid orders</small>
              </article>
              <article className="stat-card">
                <span>Products sold</span>
                <strong>{paidOrders.length}</strong>
                <small>Paid product orders</small>
              </article>
              <article className="stat-card">
                <span>Contact messages</span>
                <strong>{visibleDashboard.enquiries.length}</strong>
                <small>Enquiries from the website</small>
              </article>
              <article className="stat-card">
                <span>Repair requests</span>
                <strong>{visibleDashboard.serviceBookings.length}</strong>
                <small>Appointments awaiting confirmation</small>
              </article>
            </section>

            <section className="admin-card">
              <div className="admin-section-heading">
                <div>
                  <h2>Product sales</h2>
                  <p className="muted">Units and revenue from successfully paid orders.</p>
                </div>
              </div>
              {Object.keys(salesByProduct).length === 0 ? (
                <p className="dashboard-empty">Sales will appear here after the first payment.</p>
              ) : (
                <div className="sales-list">
                  <div className="sales-row sales-header">
                    <span>Product</span><span>Units sold</span><span>Revenue</span>
                  </div>
                  {Object.entries(salesByProduct)
                    .sort(([, first], [, second]) => second.units - first.units)
                    .map(([productName, sales]) => (
                      <div className="sales-row" key={productName}>
                        <strong>{productName}</strong>
                        <span>{sales.units}</span>
                        <strong>{formatCurrency(sales.revenue)}</strong>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Orders</h2>
                  <p className="muted">
                    {visibleDashboard.orders.length} total · {paidOrders.length} paid
                  </p>
                </div>
              </div>
              {visibleDashboard.orders.length === 0 ? (
                <p>No orders yet.</p>
              ) : (
                <div className="admin-enquiries">
                  {visibleDashboard.orders.map(order => (
                    <article className="enquiry-card" key={order.id}>
                      <div className="enquiry-top">
                        <div>
                          <h3>{order.productName} — {formatCurrency(order.amount)}</h3>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <strong>{order.status === 'paid' ? 'Paid' : 'Payment pending'}</strong>
                      </div>
                      <p>
                        <b>Customer:</b> {order.customer.name} ·{' '}
                        <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a> ·{' '}
                        <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
                      </p>
                      <p>
                        <b>Delivery:</b>{' '}
                        {[
                          order.customer.addressLine1,
                          order.customer.addressLine2,
                          order.customer.city,
                          order.customer.state,
                          order.customer.pincode,
                        ].filter(Boolean).join(', ')}
                      </p>
                      {order.paymentId && <p><b>Payment ID:</b> {order.paymentId}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-card">
              <h2>Repair service requests</h2>
              <p className="muted">{visibleDashboard.serviceBookings.length} total requests</p>
              {visibleDashboard.serviceBookings.length === 0 ? (
                <p>No repair requests yet.</p>
              ) : (
                <div className="admin-enquiries">
                  {visibleDashboard.serviceBookings.map(booking => (
                    <article className="enquiry-card" key={booking.id}>
                      <div className="enquiry-top">
                        <div>
                          <h3>{booking.productName}</h3>
                          <span>{new Date(booking.createdAt).toLocaleString()}</span>
                        </div>
                        {isDemoMode ? (
                          <strong>Sample · Pending</strong>
                        ) : (
                          <div className="service-status-actions">
                            <strong>
                              {booking.status === 'pending'
                                ? 'Needs decision'
                                : booking.status === 'accepted'
                                  ? booking.customerNotifiedAt
                                    ? 'Accepted · email sent'
                                    : 'Accepted · email not sent'
                                  : 'Rejected'}
                            </strong>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  disabled={updatingServiceId === booking.id || !booking.email}
                                  onClick={() => void updateServiceBooking(booking.id, 'accept')}
                                  title={!booking.email
                                    ? 'A customer email address is required to accept by email.'
                                    : undefined}
                                  type="button"
                                >
                                  {updatingServiceId === booking.id ? 'Working…' : 'Accept'}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  disabled={updatingServiceId === booking.id}
                                  onClick={() => void updateServiceBooking(booking.id, 'reject')}
                                  type="button"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {booking.status === 'accepted' && !booking.customerNotifiedAt && (
                              <button
                                className="btn btn-outline"
                                disabled={updatingServiceId === booking.id}
                                onClick={() => void updateServiceBooking(
                                  booking.id,
                                  'resend-confirmation',
                                )}
                                type="button"
                              >
                                {updatingServiceId === booking.id
                                  ? 'Sending…'
                                  : 'Send confirmation email'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p>
                        <b>Customer:</b> {booking.name} ·{' '}
                        <a href={`tel:${booking.phone}`}>{booking.phone}</a>
                        {booking.email && (
                          <> · <a href={`mailto:${booking.email}`}>{booking.email}</a></>
                        )}
                      </p>
                      <p>
                        <b>Preferred visit:</b> {booking.preferredDate} · {booking.preferredTime}
                      </p>
                      <p><b>Address:</b> {booking.address}</p>
                      <p className="enquiry-message"><b>Issue:</b> {booking.issue}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-card">
              <h2>Website enquiries</h2>
              <p className="muted">{visibleDashboard.enquiries.length} total enquiries</p>
              {isLoading && !isDemoMode ? (
                <p>Loading…</p>
              ) : visibleDashboard.enquiries.length === 0 ? (
                <p>No enquiries yet.</p>
              ) : (
                <div className="admin-enquiries">
                  {visibleDashboard.enquiries.map(enquiry => (
                    <article className="enquiry-card" key={enquiry.id}>
                      <div className="enquiry-top">
                        <div>
                          <h3>{enquiry.name}</h3>
                          <span>{new Date(enquiry.createdAt).toLocaleString()}</span>
                        </div>
                        {isDemoMode ? (
                          <strong>Sample</strong>
                        ) : (
                          <button
                            className="btn btn-danger"
                            onClick={() => void removeEnquiry(enquiry.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p>
                        <b>Phone:</b> <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                        {' · '}<b>Email:</b>{' '}
                        {enquiry.email
                          ? <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                          : '—'}
                      </p>
                      <p><b>Interest:</b> {enquiry.interest}</p>
                      {enquiry.message && (
                        <p className="enquiry-message">{enquiry.message}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
