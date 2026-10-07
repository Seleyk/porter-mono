// Called after the customer approves the payment sheet. Checks with Stripe
// that the card hold is in place, then marks the booking paid so it shows up
// on the porters' job board.
//
// POST { bookingId } → { booking }

import { adminClient, HttpError, json, requireUser, serve, stripe, userClient } from "../_shared/http.ts";

serve(async (req) => {
  const db = userClient(req);
  const user = await requireUser(db);
  const { bookingId } = await req.json();
  if (typeof bookingId !== "string") throw new HttpError(400, "bookingId is required.");

  const { data: booking } = await db
    .from("service_requests")
    .select("id, customer_id, status, payment_status, stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.customer_id !== user.id) throw new HttpError(404, "Booking not found.");
  if (booking.payment_status !== "pending") return json({ booking }); // already confirmed
  if (booking.status !== "pending") throw new HttpError(409, "This booking can no longer be paid for.");
  if (!booking.stripe_payment_intent_id) throw new HttpError(409, "This booking has no payment.");

  const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
  if (intent.status !== "requires_capture" && intent.status !== "succeeded") {
    throw new HttpError(402, "Your payment didn't go through. Please try again.");
  }

  const { data: updated, error } = await adminClient()
    .from("service_requests")
    .update({ payment_status: "processing" })
    .eq("id", booking.id)
    .eq("payment_status", "pending")
    .select()
    .maybeSingle();
  if (error) throw error;
  return json({ booking: updated ?? booking });
});
