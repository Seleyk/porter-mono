# Supabase

The backend for both apps: Postgres (tables, RLS, functions), Auth, Realtime and Deno edge functions.
Hosted project: **porter-platform-mvp** (`nybpysdcbzygbcicxumh`, us-east-1).

```
supabase/
├─ config.toml        local stack + edge function settings (`supabase start`)
├─ migrations/        every schema change, in order. The DB is built from these.
└─ functions/         edge functions (create-payment-intent, create-porter-box-order)
```

## Workflow

One-time setup on your machine:

```sh
npx supabase login
npx supabase link --project-ref nybpysdcbzygbcicxumh
# The hosted DB already contains everything in the baseline, so record it as applied
# (writes one row to the hosted migration history table; changes no schema):
npx supabase migration repair --status applied 20261004000000
```

Making a schema change:

```sh
npx supabase migration new <what_it_does>   # write SQL in the new file
npx supabase db reset                       # replay all migrations locally (needs Docker)
npx supabase db push                        # apply to the hosted project
npm run gen:types                           # refresh packages/shared/src/database.types.ts
```

Never change the schema from the dashboard: changes made there don't exist in the repo
and the next `db push` or `db reset` won't know about them.

## What the live database looked like on 2026-10-04

The baseline migration reproduces it exactly (checked by fingerprinting columns,
constraints, policies, triggers and functions on both sides). Data at that point: 13 auth
users, 2 profiles, 32 service requests, no hubs and no Porter Box orders. Data is not
part of the migrations.

Things in it the driver app will run into. They are recorded as-is in the baseline and
should be fixed in follow-up migrations:

- **Realtime is off for every table.** `supabase_realtime` publishes nothing, so the
  customer tracking screen's `postgres_changes` listener never fires. Add
  `service_requests` (and `porter_locations`) to the publication.
- **A porter cannot accept a job.** The only UPDATE policy on `service_requests` is
  "customer or assigned porter", and an open job has no porter yet. Needs an
  `accept_request` RPC that claims atomically.
- **Users can edit fields they shouldn't.** A porter can set their own
  `verification_status = 'approved'`; either side of a job can rewrite its price,
  `porter_id` or `payment_status`. The UPDATE policies have no column limits and no
  `WITH CHECK`.
- **"Users can insert own profile"** passes for any signed-in user
  (`... OR auth.uid() IS NOT NULL`), so the stricter sibling policy does nothing.
- **Profiles are private to their owner.** A customer can't read their porter's name or
  vehicle, and a porter can't read the customer's name.
- **No storage buckets** (needed for proof-of-delivery photos and avatars).
- **No indexes** beyond primary keys (e.g. `service_requests(status)`, `(customer_id)`, `(porter_id)`).
- `service_type` allows `luggage | shopping | packages`; the app maps parcels and other to `packages`.
- `delivery_tracking` uses `timestamp` without time zone and a `point`, unlike every other table.
- `porter_box_orders.customer_id` references `auth.users`, not `profiles`.
- `create-payment-intent` is deployed with JWT verification off and trusts the amount
  the phone sends (`config.toml` keeps that so a deploy doesn't change behaviour silently).
- Advisor warnings: `update_updated_at_column` has a mutable `search_path`; leaked
  password protection is off.
