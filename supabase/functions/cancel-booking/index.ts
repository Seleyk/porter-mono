// Cancels the customer's booking and releases the card hold. Nothing is
// charged: the money was only authorized (see create-booking).
//
// POST { bookingId } → { booking }

import { adminClient, HttpError, json, requireUser, rpcError, serve, stripe, userClient } from "../_shared/http.ts";

serve(async (req) => {
  const db = userClient(req);
  await requireUser(db);
  const { bookingId } = await req.json();
  if (typeof bookingId !== "string") throw new HttpError(400, "bookingId is required.");

  // The job function checks it's the caller's booking and still cancellable.
  const { data: cancelled, error } = await db.rpc("cancel_request", { request_id: bookingId });
  if (error) throw rpcError(error);

  const intentId: string | null = cancelled.stripe_payment_intent_id;
  if (!intentId) return json({ booking: cancelled });

  const intent = await stripe.paymentIntents.retrieve(intentId);
  if (intent.status === "succeeded") {
    // Shouldn't happen (capture waits for completion), but never keep the money.
    await stripe.refunds.create({ payment_intent: intentId }, { idempotencyKey: `cancel-refund-${bookingId}` });
  } else if (intent.status !== "canceled") {
    await stripe.paymentIntents.cancel(intentId, { cancellation_reason: "requested_by_customer" });
  }

  // An unpaid booking (card never confirmed) stays "pending": nothing was held.
  if (cancelled.payment_status === "pending") return json({ booking: cancelled });

  const { data: updated, error: updateError } = await adminClient()
    .from("service_requests")
    .update({ payment_status: "refunded" })
    .eq("id", bookingId)
    .select()
    .single();
  if (updateError) throw updateError;
  return json({ booking: updated });
});
