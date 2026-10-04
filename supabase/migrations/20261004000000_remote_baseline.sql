-- Baseline of the hosted project "porter-platform-mvp" (ref nybpysdcbzygbcicxumh),
-- read from the live database on 2026-10-04. Everything below already exists in
-- the hosted project: this file records it, it does not change it.
--
-- The hosted project has no migration history yet. Before the first
-- `supabase db push`, mark this file as applied so it is not re-run there:
--   supabase migration repair --status applied 20261004000000
--
-- Known problems are recorded as-is here and fixed in later migrations; see
-- supabase/README.md.

-- ─── Functions ───────────────────────────────────────────────────────────────

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id                  uuid        not null,
  user_type           text        not null,
  first_name          text        not null,
  last_name           text        not null,
  phone               text,
  avatar_url          text,
  email_verified      boolean     default false,
  vehicle_make        text,
  vehicle_model       text,
  vehicle_color       text,
  license_plate       text,
  verification_status text        default 'pending'::text,
  stripe_customer_id  text,
  is_active           boolean     default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
  constraint profiles_user_type_check check (user_type = any (array['customer'::text, 'porter'::text])),
  constraint profiles_verification_status_check check (verification_status = any (array['pending'::text, 'approved'::text, 'rejected'::text]))
);

create table public.service_requests (
  id                     uuid        not null default gen_random_uuid(),
  customer_id            uuid        not null,
  porter_id              uuid,
  service_type           text        not null,
  item_count             integer     default 1,
  item_size              text        default 'medium'::text,
  special_instructions   text,
  pickup_address         text        not null,
  pickup_latitude        numeric     not null,
  pickup_longitude       numeric     not null,
  dropoff_address        text        not null,
  dropoff_latitude       numeric     not null,
  dropoff_longitude      numeric     not null,
  estimated_pickup_time  timestamptz,
  estimated_dropoff_time timestamptz,
  actual_pickup_time     timestamptz,
  actual_dropoff_time    timestamptz,
  status                 text        default 'pending'::text,
  base_price             numeric,
  tip_amount             numeric     default 0,
  total_price            numeric,
  payment_status         text        default 'pending'::text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  constraint service_requests_pkey primary key (id),
  constraint service_requests_customer_id_fkey foreign key (customer_id) references public.profiles(id),
  constraint service_requests_porter_id_fkey foreign key (porter_id) references public.profiles(id),
  constraint service_requests_service_type_check check (service_type = any (array['luggage'::text, 'shopping'::text, 'packages'::text])),
  constraint service_requests_item_size_check check (item_size = any (array['small'::text, 'medium'::text, 'large'::text])),
  constraint service_requests_status_check check (status = any (array['pending'::text, 'matched'::text, 'accepted'::text, 'picked_up'::text, 'completed'::text, 'cancelled'::text])),
  constraint service_requests_payment_status_check check (payment_status = any (array['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))
);

create table public.porter_locations (
  id         uuid        not null default gen_random_uuid(),
  porter_id  uuid        not null,
  latitude   numeric     not null,
  longitude  numeric     not null,
  heading    numeric,
  is_online  boolean     default true,
  updated_at timestamptz default now(),
  constraint porter_locations_pkey primary key (id),
  constraint porter_locations_porter_id_key unique (porter_id),
  constraint porter_locations_porter_id_fkey foreign key (porter_id) references public.profiles(id)
);

create table public.porter_hubs (
  id              uuid        not null default gen_random_uuid(),
  name            text        not null,
  address         text        not null,
  latitude        numeric     not null,
  longitude       numeric     not null,
  operating_hours text        default '6:00-22:00'::text,
  capacity        integer     default 10,
  is_active       boolean     default true,
  created_at      timestamptz default now(),
  constraint porter_hubs_pkey primary key (id)
);

create table public.messages (
  id         uuid        not null default gen_random_uuid(),
  request_id uuid        not null,
  sender_id  uuid        not null,
  message    text        not null,
  created_at timestamptz default now(),
  constraint messages_pkey primary key (id),
  constraint messages_request_id_fkey foreign key (request_id) references public.service_requests(id),
  constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id)
);

create table public.ratings (
  id         uuid        not null default gen_random_uuid(),
  request_id uuid        not null,
  rater_id   uuid        not null,
  rated_id   uuid        not null,
  rating     integer,
  comment    text,
  created_at timestamptz default now(),
  constraint ratings_pkey primary key (id),
  constraint ratings_request_id_fkey foreign key (request_id) references public.service_requests(id),
  constraint ratings_rater_id_fkey foreign key (rater_id) references public.profiles(id),
  constraint ratings_rated_id_fkey foreign key (rated_id) references public.profiles(id),
  constraint ratings_rating_check check ((rating >= 1) and (rating <= 5))
);

-- Note: timestamp WITHOUT time zone and a geometric `point`, unlike every other table.
create table public.delivery_tracking (
  id                 uuid      not null default gen_random_uuid(),
  service_request_id uuid,
  porter_id          uuid,
  status             text,
  current_location   point,
  estimated_arrival  timestamp,
  created_at         timestamp default now(),
  updated_at         timestamp default now(),
  constraint delivery_tracking_pkey primary key (id),
  constraint delivery_tracking_service_request_id_fkey foreign key (service_request_id) references public.service_requests(id),
  constraint delivery_tracking_porter_id_fkey foreign key (porter_id) references public.profiles(id),
  constraint delivery_tracking_status_check check (status = any (array['porter_assigned'::text, 'en_route_pickup'::text, 'at_pickup'::text, 'en_route_delivery'::text, 'delivered'::text]))
);

create table public.porter_box_orders (
  id             uuid        not null default gen_random_uuid(),
  customer_id    uuid        not null,
  hub_id         uuid        not null,
  pickup_code    text        not null,
  dropped_at     timestamptz not null default now(),
  collected_at   timestamptz,
  charge_cents   integer     not null default 0,
  payment_status text        not null default 'pending'::text,
  is_collected   boolean     not null default false,
  constraint porter_box_orders_pkey primary key (id),
  constraint porter_box_orders_customer_id_fkey foreign key (customer_id) references auth.users(id),
  constraint porter_box_orders_hub_id_fkey foreign key (hub_id) references public.porter_hubs(id)
);

-- ─── Triggers ────────────────────────────────────────────────────────────────

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.update_updated_at_column();

create trigger update_porter_locations_updated_at
  before update on public.porter_locations
  for each row execute function public.update_updated_at_column();

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.service_requests  enable row level security;
alter table public.porter_locations  enable row level security;
alter table public.porter_hubs       enable row level security;
alter table public.messages          enable row level security;
alter table public.ratings           enable row level security;
alter table public.delivery_tracking enable row level security;
alter table public.porter_box_orders enable row level security;

-- profiles
create policy "Enable insert for authenticated users" on public.profiles
  as permissive for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  as permissive for insert to public
  with check ((auth.uid() = id) or (auth.uid() is not null));

create policy "Users can update own profile" on public.profiles
  as permissive for update to public
  using (auth.uid() = id);

create policy "Users can view own profile" on public.profiles
  as permissive for select to public
  using (auth.uid() = id);

-- service_requests
create policy "Customers can create requests" on public.service_requests
  as permissive for insert to public
  with check (auth.uid() = customer_id);

create policy "Participants can update requests" on public.service_requests
  as permissive for update to public
  using ((auth.uid() = customer_id) or (auth.uid() = porter_id));

create policy "Service requests viewable by participants" on public.service_requests
  as permissive for select to public
  using (
    (auth.uid() = customer_id)
    or (auth.uid() = porter_id)
    or (
      (porter_id is null)
      and (exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.user_type = 'porter'::text
          and profiles.is_active = true
      ))
    )
  );

-- porter_locations
create policy "Porter locations viewable appropriately" on public.porter_locations
  as permissive for select to public
  using (
    (auth.uid() = porter_id)
    or (exists (
      select 1 from public.service_requests
      where service_requests.porter_id = porter_locations.porter_id
        and service_requests.customer_id = auth.uid()
        and service_requests.status = any (array['accepted'::text, 'picked_up'::text])
    ))
  );

create policy "Porters can manage own location" on public.porter_locations
  as permissive for all to public
  using (auth.uid() = porter_id);

-- porter_hubs
create policy "Porter hubs are publicly viewable" on public.porter_hubs
  as permissive for select to public
  using (true);

-- messages
create policy "Messages viewable by request participants" on public.messages
  as permissive for select to public
  using (exists (
    select 1 from public.service_requests
    where service_requests.id = messages.request_id
      and ((service_requests.customer_id = auth.uid()) or (service_requests.porter_id = auth.uid()))
  ));

create policy "Request participants can send messages" on public.messages
  as permissive for insert to public
  with check (
    (auth.uid() = sender_id)
    and (exists (
      select 1 from public.service_requests
      where service_requests.id = messages.request_id
        and ((service_requests.customer_id = auth.uid()) or (service_requests.porter_id = auth.uid()))
    ))
  );

-- ratings
create policy "Ratings viewable by participants" on public.ratings
  as permissive for select to public
  using ((auth.uid() = rater_id) or (auth.uid() = rated_id));

create policy "Users can create ratings" on public.ratings
  as permissive for insert to public
  with check (auth.uid() = rater_id);

-- delivery_tracking
create policy "Users can view their delivery tracking" on public.delivery_tracking
  as permissive for select to public
  using (
    (service_request_id in (
      select service_requests.id from public.service_requests
      where service_requests.customer_id = auth.uid()
    ))
    or (porter_id = auth.uid())
  );

-- porter_box_orders
create policy "Users insert own orders" on public.porter_box_orders
  as permissive for insert to public
  with check (auth.uid() = customer_id);

create policy "Users see own orders" on public.porter_box_orders
  as permissive for select to public
  using (auth.uid() = customer_id);

create policy "Users update own orders" on public.porter_box_orders
  as permissive for update to public
  using (auth.uid() = customer_id);

-- Realtime: no public table is in the supabase_realtime publication on the
-- hosted project, so postgres_changes subscriptions receive nothing today.
-- Storage: no buckets exist.
