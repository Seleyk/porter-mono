// Tips the porter on a completed delivery, as a separate card payment.
//
// POST { bookingId, amountUSD }        → { clientSecret }  (show the payment sheet)
// POST { bookingId, confirm: true }    → { booking }       (after the sheet succeeds)
//
// The tip is only recorded on the booking once Stripe says it's paid, then
// goes to the porter in full.

import { adminClient, HttpError, json, requireUser, serve, stripe, toCents, userClient } from "../_shared/http.ts";
import { payOutTip } from "../_shared/payouts.ts";

const MAX_TIP_USD = 500;

serve(async (req) => {
  const db = userClient(req);
  const user = await requireUser(db);
  const { bookingId, amountUSD, confirm } = await req.json();
  if (typeof bookingId !== "string") throw new HttpError(400, "bookingId is required.");

  const { data: booking } = await db
    .from("service_requests")
    .select("id, customer_id, status, base_price, tip_amount, tip_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.customer_id !== user.id) throw new HttpError(404, "Booking not found.");
  if (booking.status !== "completed") throw new HttpError(409, "You can tip once the delivery is complete.");
  if (Number(booking.tip_amount ?? 0) > 0) throw new HttpError(409, "You've already tipped for this delivery.");

  const admin = adminClient();

  if (confirm) {
    if (!booking.tip_payment_intent_id) throw new HttpError(409, "No tip payment was started.");
    const intent = await stripe.paymentIntents.retrieve(booking.tip_payment_intent_id);
    if (intent.status !== "succeeded") throw new HttpError(402, "Your tip payment didn't go through.");
    const tip = intent.amount / 100;
    const { data: updated, error } = await admin
      .from("service_requests")
      .update({ tip_amount: tip, total_price: Number(booking.base_price ?? 0) + tip })
      .eq("id", booking.id)
      .select()
      .single();
    if (error) throw error;
    await payOutTip(admin, booking.id).catch((err) => console.error(`Tip payout failed for ${booking.id}`, err));
    return json({ booking: updated });
  }

  if (!(Number.isFinite(amountUSD) && amountUSD >= 1 && amountUSD <= MAX_TIP_USD)) {
    throw new HttpError(400, `Tips can be $1 to $${MAX_TIP_USD}.`);
  }
  const cents = toCents(amountUSD);

  const intent = await stripe.paymentIntents.create(
    {
      amount: cents,
      currency: "usd",
      payment_method_types: ["card", "link", "cashapp"],
      description: `Porter tip ${booking.id}`,
      metadata: { kind: "tip", booking_id: booking.id, customer_id: user.id },
    },
    { idempotencyKey: `tip-${booking.id}-${cents}` },
  );

  const { error } = await admin
    .from("service_requests")
    .update({ tip_payment_intent_id: intent.id })
    .eq("id", booking.id);
  if (error) throw error;

  return json({ clientSecret: intent.client_secret });
});
