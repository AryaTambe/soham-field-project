create table if not exists public.enquiries (
  id uuid primary key,
  name text not null,
  phone text not null,
  email text not null default '',
  interest text not null,
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

create table if not exists public.service_bookings (
  id uuid primary key,
  name text not null,
  phone text not null,
  email text not null default '',
  product_name text not null,
  issue text not null,
  preferred_date date not null,
  preferred_time text not null,
  address text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  customer_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists service_bookings_created_at_idx
  on public.service_bookings (created_at desc);

create table if not exists public.orders (
  razorpay_order_id text primary key,
  product_name text not null,
  category text not null,
  amount integer not null check (amount > 0),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address_line1 text not null,
  address_line2 text not null default '',
  city text not null,
  state text not null,
  pincode text not null,
  status text not null default 'created' check (status in ('created', 'paid')),
  payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);
create index if not exists orders_paid_at_idx
  on public.orders (paid_at desc)
  where status = 'paid';

alter table public.enquiries enable row level security;
alter table public.service_bookings enable row level security;
alter table public.orders enable row level security;
