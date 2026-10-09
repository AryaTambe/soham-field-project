alter table public.service_bookings
  add column if not exists status text not null default 'pending';

alter table public.service_bookings
  add column if not exists customer_notified_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_bookings_status_check'
      and conrelid = 'public.service_bookings'::regclass
  ) then
    alter table public.service_bookings
      add constraint service_bookings_status_check
      check (status in ('pending', 'accepted', 'rejected'));
  end if;
end
$$;
