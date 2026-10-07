-- Bookings are paid for before porters see them.
--
-- create-booking (edge function) now creates every booking, with the price
-- calculated on the server, and places a card hold (Stripe PaymentIntent,
-- manual capture). The booking reaches the job board once confirm-booking
-- sees the hold in place. complete-job captures it, cancel-booking releases
-- it, and add-tip charges tips separately.
--
-- payment_status keeps its existing values:
--   pending     no card hold yet          processing  card authorized (on hold)
--   completed   captured on completion    refunded    hold released on cancel
--   failed      capture failed

alter table public.service_requests
  add column if not exists stripe_payment_intent_id text unique,
  add column if not exists tip_payment_intent_id    text unique;

comment on column public.service_requests.stripe_payment_intent_id is
  'Stripe PaymentIntent (manual capture) for the delivery price. Set by create-booking.';
comment on column public.service_requests.tip_payment_intent_id is
  'Stripe PaymentIntent for the tip. Set by add-tip; tip_amount is set once it succeeds.';

-- Bookings are created by the create-booking edge function (service role).
-- The apps can no longer insert a job directly, with a price of their choosing.
alter policy "Customers can create requests" on public.service_requests
  to authenticated
  with check (false);

-- Porters only see and accept bookings whose payment is on hold.
alter policy "Service requests viewable by participants" on public.service_requests
  using (
    auth.uid() = customer_id
    or auth.uid() = porter_id
    or (porter_id is null and status = 'pending' and payment_status = 'processing' and public.is_approved_porter())
  );

create or replace function public.nearby_open_requests(
  lat double precision,
  lng double precision,
  radius_km double precision default 15
)
returns setof public.service_requests
language sql
stable
security definer
set search_path = ''
as $$
  select r.*
  from public.service_requests r
  cross join lateral (
    select 6371 * 2 * asin(sqrt(
      power(sin(radians(r.pickup_latitude::double precision - lat) / 2), 2)
      + cos(radians(lat)) * cos(radians(r.pickup_latitude::double precision))
      * power(sin(radians(r.pickup_longitude::double precision - lng) / 2), 2)
    )) as km
  ) d
  where public.is_approved_porter()
    and r.status = 'pending'
    and r.payment_status = 'processing'
    and r.porter_id is null
    and d.km <= radius_km
  order by d.km
  limit 50;
$$;

create or replace function public.accept_request(request_id uuid)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.service_requests;
begin
  if not public.is_approved_porter() then
    raise exception 'Only approved porters can accept jobs' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.service_requests
    where porter_id = auth.uid() and status in ('accepted', 'picked_up')
  ) then
    raise exception 'Finish your current job before accepting another' using errcode = 'P0001';
  end if;

  -- First porter wins: the WHERE clause only matches while the job is open.
  update public.service_requests
     set porter_id = auth.uid(), status = 'accepted'
   where id = request_id and status = 'pending' and porter_id is null
     and payment_status = 'processing'
  returning * into claimed;

  if claimed.id is null then
    raise exception 'This job is no longer available' using errcode = 'P0001';
  end if;
  return claimed;
end;
$$;

-- Tips are recorded by the add-tip edge function once the payment succeeds.
revoke execute on function public.add_tip(uuid, numeric) from authenticated;
