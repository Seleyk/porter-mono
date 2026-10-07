// Creates a delivery booking and the card hold that pays for it.
//
// The price is calculated here (never taken from the phone). The booking is
// saved unpaid and stays off the job board until confirm-booking sees the
// card authorized. The PaymentIntent uses manual capture: the money is only
// held now, captured when the porter completes the job (complete-job), and
// released if the booking is cancelled (cancel-booking).
//
// POST {
//   pickup:  { address, lat, lng }, dropoff: { address, lat, lng },
//   itemType: "luggage" | "shopping" | "parcels" | "other",
//   itemCounts: { large, standard, small }, itemValueUSD?,
//   speed: "priority" | "standard" | "scheduled",
//   dropoffMethod: "door" | "box", hubName?, specialRequests?
// } → { bookingId, clientSecret, amountUSD }

import { adminClient, HttpError, json, requireUser, serve, stripe, toCents, userClient } from "../_shared/http.ts";
import {
  DELIVERY_SPEEDS,
  type DeliverySpeed,
  type ItemCounts,
  isItemCounts,
  isLatLng,
  quoteDelivery,
  routeBetween,
} from "../_shared/deliveryQuote.ts";
import { formatBookingNotes } from "../_shared/bookingNotes.ts";

const ITEM_TYPES = ["luggage", "shopping", "parcels", "other"] as const;
type ItemType = (typeof ITEM_TYPES)[number];

function serviceTypeFor(itemType: ItemType): "luggage" | "shopping" | "packages" {
  if (itemType === "luggage") return "luggage";
  if (itemType === "shopping") return "shopping";
  return "packages"; // parcels + other
}

function dominantSize(c: ItemCounts): "small" | "medium" | "large" {
  if (c.large >= c.standard && c.large >= c.small) return "large";
  if (c.small > c.large && c.small >= c.standard) return "small";
  return "medium";
}

function isStop(v: unknown): v is { address: string; lat: number; lng: number } {
  const address = (v as { address?: unknown })?.address;
  return isLatLng(v) && typeof address === "string" && address.trim().length > 0;
}

serve(async (req) => {
  const user = await requireUser(userClient(req));
  const body = await req.json();
  const { pickup, dropoff, itemType, itemCounts, itemValueUSD, speed, dropoffMethod, hubName, specialRequests } = body;

  if (!isStop(pickup) || !isStop(dropoff)) throw new HttpError(400, "Pickup and drop-off addresses are required.");
  if (!ITEM_TYPES.includes(itemType)) throw new HttpError(400, "Choose what you're sending.");
  if (!isItemCounts(itemCounts)) throw new HttpError(400, "Item counts are invalid.");
  if (!DELIVERY_SPEEDS.includes(speed)) throw new HttpError(400, "Choose a delivery speed.");
  if (dropoffMethod !== "door" && dropoffMethod !== "box") throw new HttpError(400, "Choose a drop-off method.");
  if (itemValueUSD != null && !(Number.isFinite(itemValueUSD) && itemValueUSD >= 0)) {
    throw new HttpError(400, "Item value is invalid.");
  }

  const route = await routeBetween(pickup, dropoff, Deno.env.get("MAPBOX_TOKEN"));
  const quote = quoteDelivery({ ...route, itemValueUSD, itemCounts });
  const { priceUSD } = quote.prices[speed as DeliverySpeed];
  if (priceUSD < 1) throw new HttpError(400, "This trip is too short to price.");

  const itemCount = itemCounts.large + itemCounts.standard + itemCounts.small;
  const admin = adminClient();

  const { data: booking, error: insertError } = await admin
    .from("service_requests")
    .insert({
      customer_id: user.id,
      service_type: serviceTypeFor(itemType),
      item_count: Math.max(1, itemCount),
      item_size: dominantSize(itemCounts),
      pickup_address: pickup.address.trim().slice(0, 300),
      pickup_latitude: pickup.lat,
      pickup_longitude: pickup.lng,
      dropoff_address: dropoff.address.trim().slice(0, 300),
      dropoff_latitude: dropoff.lat,
      dropoff_longitude: dropoff.lng,
      base_price: priceUSD,
      total_price: priceUSD,
      tip_amount: 0,
      status: "pending",
      payment_status: "pending",
      special_instructions: formatBookingNotes(
        typeof specialRequests === "string" ? specialRequests.slice(0, 500) : null,
        {
          speed,
          dropoff: dropoffMethod,
          counts: itemCounts,
          hub: dropoffMethod === "box" && typeof hubName === "string" ? hubName.slice(0, 100) : undefined,
        },
      ),
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: toCents(priceUSD),
        currency: "usd",
        capture_method: "manual",
        payment_method_types: ["card", "link", "cashapp"],
        description: `Porter delivery ${booking.id}`,
        metadata: { kind: "booking", booking_id: booking.id, customer_id: user.id },
      },
      { idempotencyKey: `booking-${booking.id}` },
    );

    const { error: linkError } = await admin
      .from("service_requests")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", booking.id);
    if (linkError) throw linkError;

    return json({ bookingId: booking.id, clientSecret: intent.client_secret, amountUSD: priceUSD });
  } catch (err) {
    // No payment to go with it: don't leave an unpaid booking behind.
    await admin.from("service_requests").delete().eq("id", booking.id);
    throw err;
  }
});
