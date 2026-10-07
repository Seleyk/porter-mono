// Moves porters' earnings to their Stripe Connect accounts.
//
// Each transfer is funded by the customer's own charge (source_transaction),
// so it never depends on the platform balance, and uses an idempotency key so
// a retry can't pay twice. A porter who hasn't finished setting up payouts is
// paid later by payOwedJobs, called when their account becomes enabled.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { stripe, toCents } from "./http.ts";
import { PORTER_RATES } from "./porterFare.ts";

type PayoutResult = "paid" | "already_paid" | "owed" | "nothing_to_pay";

async function porterAccount(admin: SupabaseClient, porterId: string): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("stripe_account_id, payouts_enabled")
    .eq("id", porterId)
    .maybeSingle();
  return data?.payouts_enabled && data.stripe_account_id ? data.stripe_account_id : null;
}

async function chargeOf(intentId: string): Promise<string | null> {
  const intent = await stripe.paymentIntents.retrieve(intentId);
  if (intent.status !== "succeeded") return null;
  return typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id ?? null;
}

/** Transfers the porter's share of a completed, paid job. */
export async function payOutJob(admin: SupabaseClient, jobId: string): Promise<PayoutResult> {
  const { data: job } = await admin
    .from("service_requests")
    .select("id, porter_id, status, payment_status, base_price, porter_payout, stripe_payment_intent_id, payout_transfer_id")
    .eq("id", jobId)
    .single();
  if (!job?.porter_id || job.status !== "completed" || job.payment_status !== "completed" || !job.stripe_payment_intent_id) {
    return "nothing_to_pay";
  }
  if (job.payout_transfer_id) return "already_paid";

  const destination = await porterAccount(admin, job.porter_id);
  if (!destination) return "owed";

  const amountUSD = Number(job.porter_payout ?? Number(job.base_price ?? 0) * PORTER_RATES.DRIVER_PCT);
  const charge = await chargeOf(job.stripe_payment_intent_id);
  if (!charge || amountUSD <= 0) return "nothing_to_pay";

  const transfer = await stripe.transfers.create(
    {
      amount: toCents(amountUSD),
      currency: "usd",
      destination,
      source_transaction: charge,
      transfer_group: `job_${job.id}`,
      description: `Porter delivery ${job.id}`,
      metadata: { kind: "job", booking_id: job.id, porter_id: job.porter_id },
    },
    { idempotencyKey: `payout-${job.id}` },
  );
  await admin.from("service_requests").update({ payout_transfer_id: transfer.id }).eq("id", job.id);
  return "paid";
}

/** Transfers a paid tip in full to the job's porter. */
export async function payOutTip(admin: SupabaseClient, jobId: string): Promise<PayoutResult> {
  const { data: job } = await admin
    .from("service_requests")
    .select("id, porter_id, tip_amount, tip_payment_intent_id, tip_transfer_id")
    .eq("id", jobId)
    .single();
  if (!job?.porter_id || !job.tip_payment_intent_id || !(Number(job.tip_amount) > 0)) return "nothing_to_pay";
  if (job.tip_transfer_id) return "already_paid";

  const destination = await porterAccount(admin, job.porter_id);
  if (!destination) return "owed";

  const charge = await chargeOf(job.tip_payment_intent_id);
  if (!charge) return "nothing_to_pay";

  const transfer = await stripe.transfers.create(
    {
      amount: toCents(Number(job.tip_amount)),
      currency: "usd",
      destination,
      source_transaction: charge,
      transfer_group: `job_${job.id}`,
      description: `Porter tip ${job.id}`,
      metadata: { kind: "tip", booking_id: job.id, porter_id: job.porter_id },
    },
    { idempotencyKey: `tip-payout-${job.id}` },
  );
  await admin.from("service_requests").update({ tip_transfer_id: transfer.id }).eq("id", job.id);
  return "paid";
}

/** Pays everything a porter earned before their payouts were enabled. */
export async function payOwedJobs(admin: SupabaseClient, porterId: string): Promise<number> {
  const { data: jobs } = await admin
    .from("service_requests")
    .select("id, payout_transfer_id, tip_transfer_id, tip_amount")
    .eq("porter_id", porterId)
    .eq("status", "completed")
    .eq("payment_status", "completed")
    .or("payout_transfer_id.is.null,and(tip_transfer_id.is.null,tip_amount.gt.0)")
    .limit(100);

  let paid = 0;
  for (const job of jobs ?? []) {
    try {
      if (!job.payout_transfer_id && (await payOutJob(admin, job.id)) === "paid") paid++;
      if (!job.tip_transfer_id && Number(job.tip_amount) > 0 && (await payOutTip(admin, job.id)) === "paid") paid++;
    } catch (err) {
      console.error(`Payout failed for job ${job.id}`, err);
    }
  }
  return paid;
}
