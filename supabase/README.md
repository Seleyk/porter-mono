# Supabase

The backend for both apps: Postgres (tables, RLS, functions), Auth, Realtime and Deno edge functions.
Hosted project: **porter-platform-mvp** (`nybpysdcbzygbcicxumh`, us-east-1).

```
supabase/
├─ config.toml        local stack + edge function settings (`supabase start`)
├─ migrations/        every schema change, in order. The DB is built from these.
└─ functions/         edge functions (bookings and payments, Porter Box orders)
```

## Workflow

One-time setup on your machine:

```sh
npx supabase login
npx supabase link --project-ref nybpysdcbzygbcicxumh
```

The hosted project already has the baseline (`20261004000000`) recorded as applied
(done 2026-10-04), so `db push` starts from the next migration.

Making a schema change:

```sh
npx supabase migration new <what_it_does>   # write SQL in the new file
npx supabase db reset                       # replay all migrations locally (needs Docker)
npx supabase db push                        # apply to the hosted project
npm run gen:types                           # refresh packages/shared/src/database.types.ts
```

Never change the schema from the dashboard: changes made there don't exist in the repo
and the next `db push` or `db reset` won't know about them.

## Access rules and the job lifecycle

Apps never update a job row directly. They call these functions with `supabase.rpc(...)`:

| Who | Function | Does |
|---|---|---|
| porter | `nearby_open_requests(lat, lng, radius_km = 15)` | open jobs near the porter, nearest first |
| porter | `accept_request(request_id)` | claims an open job; first porter wins, one active job at a time |
| porter | `release_request(request_id)` | hands an accepted job back before pickup |
| porter | `advance_request(request_id, to_status, photo_path?)` | `accepted → picked_up → completed`, sets pickup/drop-off times and the proof photo |
| customer | `cancel_request(request_id)` | while pending, matched or accepted (the app calls it through `cancel-booking`) |

Only porters with `verification_status = 'approved'` (set by staff in the dashboard) see
the job board, accept work or publish a location. Users can't change their own role,
approval, Stripe id or active flag, and a new job always starts `pending` with no porter.
The two people on a job can see each other's profile and, once accepted, the porter's
location. Proof-of-delivery photos go in the private `proof-of-delivery` bucket at
`<request_id>/<file>`; avatars in the public `avatars` bucket at `<user_id>/<file>`.

## Bookings and payments

Bookings are created and paid for through edge functions, never inserted by the apps:

| Function | Who | Does |
|---|---|---|
| `quote-delivery` | customer | prices a trip for each speed (what the app shows) |
| `create-booking` | customer | prices it again, saves the booking unpaid and creates a card hold (Stripe PaymentIntent, manual capture) |
| `confirm-booking` | customer | after the payment sheet: checks the hold with Stripe, sets `payment_status = processing`; only then do porters see the job |
| `cancel-booking` | customer | `cancel_request`, then releases the hold (`refunded`) |
| `complete-job` | porter | `advance_request(..., 'completed')`, then captures the hold (`completed`, or `failed` for staff to follow up) |
| `add-tip` | customer | charges a tip as its own payment and records it once paid |

Prices come from `functions/_shared/porterFare.ts` (re-exported by `@porter/shared`, so the apps and
the server share one copy) and `functions/_shared/deliveryQuote.ts` (speed multipliers). Route
distance comes from Mapbox when the `MAPBOX_TOKEN` secret is set, otherwise a straight-line estimate.

Deploying:

```sh
npx supabase db push                                   # the booking_payments migration
npx supabase secrets set MAPBOX_TOKEN=pk...            # same token as the apps' EXPO_PUBLIC_MAPBOX_TOKEN
npx supabase functions deploy                          # every function in supabase/functions
npx supabase functions delete create-payment-intent   # old, unauthenticated; no longer used
```

`STRIPE_SECRET_KEY` must already be set (the Porter Box function uses it). A card hold lasts
about 7 days, so a scheduled delivery further out than that needs a different approach.

## Still open

- No porter payouts yet (Stripe Connect). No Stripe webhook yet: if the app closes between
  paying and `confirm-booking`/`add-tip` confirming, the booking or tip isn't recorded.
- `create-porter-box-order` still trusts the amount the phone sends.
- `service_type` allows `luggage | shopping | packages`; the app maps parcels and other to `packages`.
- `delivery_tracking` uses `timestamp` without time zone and a `point`, and nothing writes it.
- `porter_box_orders.customer_id` references `auth.users`, not `profiles`.
- Leaked password protection is off (Auth setting in the dashboard).

