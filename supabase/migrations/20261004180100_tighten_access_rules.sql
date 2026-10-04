-- Close the gaps in the baseline's row level security:
--   * users could approve themselves as porters or rewrite their Stripe id
--   * either side of a job could rewrite its price, porter, status or payment
--   * any signed-in user could insert a profile row for someone else
--   * anyone could rate anyone, for any job
--   * customers could rewrite a Porter Box order's charge or payment status
-- Job updates now go through the functions in the next migration.
--
-- The guard triggers only restrict the API roles (anon, authenticated).
-- Security-definer functions, the service role (edge functions) and the
-- dashboard run as other roles and are not affected.

-- ─── Helpers ─────────────────────────────────────────────────────────────────

-- True when the user is an approved, active porter. SECURITY DEFINER so RLS
-- policies can call it without recursing into the profiles policies.
create or replace function public.is_approved_porter(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.user_type = 'porter'
      and p.verification_status = 'approved'
      and p.is_active is true
  );
$$;

-- anon needs it too: the service_requests policy calls it on every read
-- (it simply returns false when nobody is signed in).
grant execute on function public.is_approved_porter(uuid) to anon, authenticated;

create or replace function public.is_api_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────

-- Loose duplicate: "... OR auth.uid() IS NOT NULL" let anyone insert any id.
drop policy "Users can insert own profile" on public.profiles;

alter policy "Users can update own profile" on public.profiles
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.guard_profile_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_api_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New accounts start unverified; only ops (service role) can approve.
    new.verification_status := 'pending';
    new.stripe_customer_id  := null;
    new.is_active           := true;
    return new;
  end if;

  if new.id                  is distinct from old.id
  or new.user_type           is distinct from old.user_type
  or new.verification_status is distinct from old.verification_status
  or new.stripe_customer_id  is distinct from old.stripe_customer_id
  or new.is_active           is distinct from old.is_active
  or new.created_at          is distinct from old.created_at then
    raise exception 'These profile fields can only be changed by Porter staff'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_profile_write
  before insert or update on public.profiles
  for each row execute function public.guard_profile_write();

-- ─── service_requests ────────────────────────────────────────────────────────

-- Only approved porters see the open job board (was: any active porter).
-- Uses the helper so this policy no longer reads profiles under RLS.
alter policy "Service requests viewable by participants" on public.service_requests
  using (
    auth.uid() = customer_id
    or auth.uid() = porter_id
    or (porter_id is null and status = 'pending' and public.is_approved_porter())
  );

alter policy "Customers can create requests" on public.service_requests
  to authenticated
  with check (auth.uid() = customer_id);

-- No direct updates from the apps any more: cancel, tip, accept and status
-- changes are functions that check who may do what.
drop policy "Participants can update requests" on public.service_requests;

create or replace function public.guard_service_request_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_role() then
    new.porter_id           := null;
    new.status              := 'pending';
    new.payment_status      := 'pending';
    new.tip_amount          := 0;
    new.total_price         := new.base_price;
    new.actual_pickup_time  := null;
    new.actual_dropoff_time := null;
  end if;
  return new;
end;
$$;

create trigger guard_service_request_insert
  before insert on public.service_requests
  for each row execute function public.guard_service_request_insert();

-- ─── ratings ─────────────────────────────────────────────────────────────────

alter table public.ratings
  add constraint ratings_request_rater_key unique (request_id, rater_id);

-- Only the two people on a completed job can rate each other.
alter policy "Users can create ratings" on public.ratings
  to authenticated
  with check (
    auth.uid() = rater_id
    and exists (
      select 1 from public.service_requests r
      where r.id = request_id
        and r.status = 'completed'
        and (
          (r.customer_id = auth.uid() and r.porter_id = rated_id)
          or (r.porter_id = auth.uid() and r.customer_id = rated_id)
        )
    )
  );

-- ─── porter_locations ────────────────────────────────────────────────────────

alter policy "Porters can manage own location" on public.porter_locations
  to authenticated
  using (auth.uid() = porter_id)
  with check (auth.uid() = porter_id and public.is_approved_porter());

-- ─── porter_box_orders ───────────────────────────────────────────────────────

-- The app only marks an order collected. Price, hub, code and payment are
-- set by the create-porter-box-order edge function.
create or replace function public.guard_porter_box_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_role() and (
       new.id             is distinct from old.id
    or new.customer_id    is distinct from old.customer_id
    or new.hub_id         is distinct from old.hub_id
    or new.pickup_code    is distinct from old.pickup_code
    or new.dropped_at     is distinct from old.dropped_at
    or new.charge_cents   is distinct from old.charge_cents
    or new.payment_status is distinct from old.payment_status
    or (old.is_collected and not new.is_collected)
  ) then
    raise exception 'Only collection can be recorded on a Porter Box order'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_porter_box_order_update
  before update on public.porter_box_orders
  for each row execute function public.guard_porter_box_order_update();

-- The edge function inserts with the customer's own token, so this can't stop
-- a client inserting directly; it does stop one marking its order paid.
create or replace function public.guard_porter_box_order_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_role() then
    new.payment_status := 'pending';
    new.is_collected   := false;
    new.collected_at   := null;
  end if;
  return new;
end;
$$;

create trigger guard_porter_box_order_insert
  before insert on public.porter_box_orders
  for each row execute function public.guard_porter_box_order_insert();

alter policy "Users update own orders" on public.porter_box_orders
  to authenticated
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);
