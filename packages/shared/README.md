# @porter/shared

Code both mobile apps import as `@porter/shared`. It is plain TypeScript with no build step;
Metro and `tsc` read `src/` directly.

| File | What |
|---|---|
| `database.types.ts` | Generated from Supabase. Don't edit; run `npm run gen:types` at the repo root. |
| `db.ts` | Row aliases (`Profile`, `ServiceRequest`, ...) and the allowed values of CHECK-constrained columns (`REQUEST_STATUSES`, ...). |
| `supabase.ts` | `createPorterClient(url, key, storage)`: the typed client with the apps' auth settings. |
| `porterFare.ts` | Porter Fare Algorithm v1.0 (rates, payout split, `calculateFare`). |
| `map.ts` | Miami center, default zoom, Mapbox styles. |
| `demo.ts` | Simulated Miami world: demo porters, hubs, favourites, `closestAvailableDriver`. |

Keep native modules (expo-*, react-native-*) out of this package: pass them in from the app,
as `createPorterClient` does with SecureStore.
