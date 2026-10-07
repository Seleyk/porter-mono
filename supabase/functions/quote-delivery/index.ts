// Prices a delivery for each speed. The customer app shows these prices, and
// create-booking charges the same calculation.
//
// POST { pickup: {lat,lng}, dropoff: {lat,lng}, itemValueUSD?, itemCounts }
//   → { distanceMiles, durationMinutes, prices: { priority|standard|scheduled: { priceUSD, porterPayoutUSD } } }

import { HttpError, json, requireUser, serve, userClient } from "../_shared/http.ts";
import { isItemCounts, isLatLng, quoteDelivery, routeBetween } from "../_shared/deliveryQuote.ts";

serve(async (req) => {
  await requireUser(userClient(req));

  const { pickup, dropoff, itemValueUSD, itemCounts } = await req.json();
  if (!isLatLng(pickup) || !isLatLng(dropoff)) throw new HttpError(400, "Pickup and drop-off locations are required.");
  if (!isItemCounts(itemCounts)) throw new HttpError(400, "Item counts are invalid.");
  if (itemValueUSD != null && !(Number.isFinite(itemValueUSD) && itemValueUSD >= 0)) {
    throw new HttpError(400, "Item value is invalid.");
  }

  const route = await routeBetween(pickup, dropoff, Deno.env.get("MAPBOX_TOKEN"));
  return json(quoteDelivery({ ...route, itemValueUSD, itemCounts }));
});
