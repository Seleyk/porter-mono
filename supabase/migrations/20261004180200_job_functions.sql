-- The job lifecycle as database functions (called with supabase.rpc).
-- Each one checks who is calling and which status change is allowed, then
-- updates the row. They are the only way the apps can change a job.
--
--   customer: cancel_request, add_tip
--   porter:   nearby_open_requests, accept_request, release_request, advance_request
--
--   pending ──accept──▶ accepted ──advance──▶ picked_up ──advance──▶ completed
--      ▲                   │
--      └─────release───────┘          cancel: pending / matched / accepted ▶ cancelled

alter table public.service_requests add column if not exists proof_photo_path text;

comment on column public.service_requests.proof_photo_path is
  'Path in the proof-of-delivery storage bucket, set by advance_request when the porter completes the job.';

-- ─── Porter: find and claim work ─────────────────────────────────────────────

-- Open jobs whose pickup is within radius_km of the porter, nearest first.
-- Plain haversine; fine at MVP volume (switch to PostGIS later if needed).
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
  returning * into claimed;

  if claimed.id is null then
    raise exception 'This job is no longer available' using errcode = 'P0001';
  end if;
  return claimed;
end;
$$;

-- Porter hands an accepted job back before pickup.
create or replace function public.release_request(request_id uuid)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  released public.service_requests;
begin
  update public.service_requests
     set porter_id = null, status = 'pending'
   where id = request_id and porter_id = auth.uid() and status = 'accepted'
  returning * into released;

  if released.id is null then
    raise exception 'Only an accepted job you hold can be released' using errcode = 'P0001';
  end if;
  return released;
end;
$$;

-- Porter moves their job forward: accepted → picked_up → completed.
create or replace function public.advance_request(
  request_id uuid,
  to_status text,
  photo_path text default null
)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  job     public.service_requests;
  updated public.service_requests;
begin
  select * into job
    from public.service_requests
   where id = request_id and porter_id = auth.uid()
   for update;

  if job.id is null then
    raise exception 'Job not found' using errcode = 'P0002';
  end if;

  if job.status = 'accepted' and to_status = 'picked_up' then
    update public.service_requests
       set status = 'picked_up', actual_pickup_time = now()
     where id = request_id
    returning * into updated;
  elsif job.status = 'picked_up' and to_status = 'completed' then
    update public.service_requests
       set status = 'completed',
           actual_dropoff_time = now(),
           proof_photo_path = coalesce(photo_path, job.proof_photo_path)
     where id = request_id
    returning * into updated;
  else
    raise exception 'Cannot move a job from % to %', job.status, to_status using errcode = 'P0001';
  end if;

  return updated;
end;
$$;

-- ─── Customer ────────────────────────────────────────────────────────────────

create or replace function public.cancel_request(request_id uuid)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  cancelled public.service_requests;
begin
  update public.service_requests
     set status = 'cancelled'
   where id = request_id
     and customer_id = auth.uid()
     and status in ('pending', 'matched', 'accepted')
  returning * into cancelled;

  if cancelled.id is null then
    raise exception 'This job can no longer be cancelled' using errcode = 'P0001';
  end if;
  return cancelled;
end;
$$;

-- Records the tip on a completed job. Charging it is still to do (Stripe).
create or replace function public.add_tip(request_id uuid, amount numeric)
returns public.service_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  tipped public.service_requests;
begin
  if amount is null or amount < 0 or amount > 500 then
    raise exception 'Tip must be between $0 and $500' using errcode = '22023';
  end if;

  update public.service_requests
     set tip_amount = round(amount, 2),
         total_price = coalesce(base_price, 0) + round(amount, 2)
   where id = request_id
     and customer_id = auth.uid()
     and status = 'completed'
  returning * into tipped;

  if tipped.id is null then
    raise exception 'Tips can only be added to your completed jobs' using errcode = 'P0001';
  end if;
  return tipped;
end;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────

revoke execute on function public.nearby_open_requests(double precision, double precision, double precision) from public, anon;
revoke execute on function public.accept_request(uuid)                   from public, anon;
revoke execute on function public.release_request(uuid)                  from public, anon;
revoke execute on function public.advance_request(uuid, text, text)      from public, anon;
revoke execute on function public.cancel_request(uuid)                   from public, anon;
revoke execute on function public.add_tip(uuid, numeric)                 from public, anon;

grant execute on function public.nearby_open_requests(double precision, double precision, double precision) to authenticated;
grant execute on function public.accept_request(uuid)                   to authenticated;
grant execute on function public.release_request(uuid)                  to authenticated;
grant execute on function public.advance_request(uuid, text, text)      to authenticated;
grant execute on function public.cancel_request(uuid)                   to authenticated;
grant execute on function public.add_tip(uuid, numeric)                 to authenticated;
