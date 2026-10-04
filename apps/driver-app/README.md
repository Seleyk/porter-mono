# Porter Driver

The app porters use to find, accept and deliver jobs. Expo SDK 54 + expo-router,
talking to the same Supabase project as the customer app through `@porter/shared`.

## Run it

1. Create `apps/driver-app/.env` with the same values the customer app uses:

   ```sh
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_KEY=...
   EXPO_PUBLIC_MAPBOX_TOKEN=...
   ```

2. Mapbox, location and the camera are native modules, so Expo Go can't run this
   app. Build a development client once (Android works without a paid Apple account):

   ```sh
   npm install                      # at the repo root
   cd apps/driver-app
   eas init                         # first time only: links an EAS project
   eas build --profile development --platform android
   ```

   Install the build on your phone, then `npx expo start` and open it from the dev client.

## Approving a porter

New porters sign up in the app and wait on "We're reviewing your account".
Approve them in the Supabase dashboard (SQL Editor):

```sql
update public.profiles
set verification_status = 'approved'
where id = (select id from auth.users where email = 'porter@example.com');
```

They can tap **Check again** and start driving.

## How a job works

| Screen | What the porter does | Database call |
|---|---|---|
| Drive | Go online; nearby open jobs (15 km) update live | `nearby_open_requests` |
| Job | Review the trip and accept | `accept_request` |
| Active job | Navigate, call the customer, mark picked up or release | `advance_request`, `release_request` |
| Active job | Take a proof photo and complete | upload to `proof-of-delivery`, `advance_request` |
| Jobs | Delivered and cancelled history | `service_requests` select |

While online or on a job the app publishes the porter's position to `porter_locations`
every ~25 m; customers can read it only while that porter is on their job.

## Not yet

- Payouts (Stripe Connect). The Jobs tab shows job totals, not earnings.
- Location while the app is in the background.
- The customer app still simulates its porter; it doesn't yet read the real one.
