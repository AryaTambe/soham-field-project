# Soham Surgical

A Next.js website for physiotherapy equipment, repair requests, customer
enquiries and online orders.

## Start the application

```bash
npm install
cp .env.example .env.local
# Add your private credentials to .env.local.
npm run dev
```

The app runs at http://localhost:3000. Build and start for production with
`npm run build && npm start`.

## Connect the database

The application uses Supabase PostgreSQL. In your Supabase project's SQL Editor,
run [`supabase/schema.sql`](./supabase/schema.sql) to create the tables and
indexes. Add `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY` to
`.env.local` and your hosting provider's environment settings.

The service-role key must never be exposed in browser code or committed to
source control. Row-level security is enabled on the application tables; all
data access uses authenticated server-side API routes.

## Configure payments and email

- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the Razorpay dashboard.
  Test with test-mode credentials before switching to live keys. The secret is
  used by server routes only.
- Enable 2-Step Verification on the Gmail account that will send website mail,
  then create a Google App Password. Set `SMTP_USER` to that Gmail address and
  `SMTP_APP_PASSWORD` to the App Password in `.env.local`. Do not use your
  normal Gmail password or expose the App Password in browser code.
- `SMTP_FROM_NAME` is optional and defaults to the Gmail address.
- `BUSINESS_EMAIL` is optional and defaults to `soham7surgical@gmail.com`.
- Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD` and a unique, long
  `ADMIN_SESSION_SECRET` to enable `/admin`.

The website saves enquiries and repair requests to Supabase even when email
delivery is not configured. Gmail SMTP is used for business notifications and
customer service-acceptance confirmations. Accepted bookings whose email could
not be sent can be retried from the dashboard. Restart the development server
after changing environment variables. On Render, add the same values under the
service's Environment settings; never commit private credentials.

Online checkout requires both the database and Razorpay credentials.

### Service request decisions

Run [`supabase/migrations/20261009_service_booking_decisions.sql`](./supabase/migrations/20261009_service_booking_decisions.sql)
in the Supabase SQL Editor to add pending/accepted/rejected status and email
tracking to an existing database. New databases get these columns from
`supabase/schema.sql`. Admins can accept or reject pending requests. Accepting
sends a confirmation to the email address entered by the customer; failed
delivery leaves the request accepted with a retry action in the dashboard.
Rejecting records the decision without sending an email.

## Dashboard and API

The authenticated `/admin` dashboard displays paid revenue, units sold,
per-product sales, payment orders, customer contact messages and repair
requests. It loads these records from the same Supabase database used by the
public site.

- `GET /api/products` and `GET /api/products/:category` return the catalogue.
- `POST /api/enquiries` validates and records customer contact messages.
- `POST /api/service-bookings` records repair and preferred-visit requests.
- `POST /api/admin/service-bookings` accepts or rejects a booking and sends or
  retries the customer confirmation email; admin authentication is required.
- `POST /api/payments/create-order` creates a Razorpay order using the
  server-verified catalogue price.
- `POST /api/payments/verify` validates the Razorpay signature, confirms the
  payment with Razorpay and records the paid order.
- `/api/admin/enquiries` returns dashboard data and allows authenticated
  enquiry deletion.

Product details and prices are maintained in `lib/products.ts`. Product image
paths can be added under `public/assets/products/`; the catalogue shows a
branded placeholder if an image is unavailable.
