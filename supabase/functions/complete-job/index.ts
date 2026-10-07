// The porter finishes a delivery: marks the job completed (with the proof
// photo) and captures the customer's card hold.
//
// POST { jobId, photoPath } → { job }

import { adminClient, HttpError, json, requireUser, rpcError, serve, stripe, userClient } from "../_shared/http.ts";

serve(async (req) => {
  const db = userClient(req);
  await requireUser(db);
  const { jobId, photoPath } = await req.json();
  if (typeof jobId !== "string") throw new HttpError(400, "jobId is required.");
  if (photoPath != null && typeof photoPath !== "string") throw new HttpError(400, "photoPath is invalid.");

  // The job function checks it's the caller's job and that it was picked up.
  const { data: job, error } = await db.rpc("advance_request", {
    request_id: jobId,
    to_status: "completed",
    photo_path: photoPath ?? null,
  });
  if (error) throw rpcError(error);

  const intentId: string | null = job.stripe_payment_intent_id;
  if (!intentId || job.payment_status !== "processing") return json({ job });

  // The delivery is done either way; a failed capture is recorded for staff
  // to follow up rather than shown to the porter as an error.
  let paymentStatus: "completed" | "failed" = "completed";
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId);
    if (intent.status === "requires_capture") {
      await stripe.paymentIntents.capture(intentId, {}, { idempotencyKey: `capture-${jobId}` });
    } else if (intent.status !== "succeeded") {
      paymentStatus = "failed";
    }
  } catch (err) {
    console.error(`Capture failed for job ${jobId}`, err);
    paymentStatus = "failed";
  }

  const { data: updated, error: updateError } = await adminClient()
    .from("service_requests")
    .update({ payment_status: paymentStatus })
    .eq("id", jobId)
    .select()
    .single();
  if (updateError) throw updateError;
  return json({ job: updated });
});
