import { callFunction } from "@porter/shared";
import { supabase } from "@/lib/supabase";

// Porters are paid through Stripe Connect (supabase/functions/porter-payouts).
// Sign-up happens on Stripe's own pages; Stripe sends the porter back to
// porterdriver://payouts when they're done.

export type PayoutState = "not_started" | "incomplete" | "pending" | "enabled";

export interface PayoutStatus {
  state: PayoutState;
  /** Earlier jobs paid out just now, once payouts became enabled. */
  paidNow?: number;
  requirementsDue?: number;
}

export function getPayoutStatus(): Promise<PayoutStatus> {
  return callFunction(supabase, "porter-payouts", { action: "status" });
}

/** Link to Stripe's payout sign-up (creates the account the first time). */
export async function payoutSetupUrl(): Promise<string> {
  const { url } = await callFunction<{ url: string }>(supabase, "porter-payouts", { action: "onboard" });
  return url;
}

/** Link to the porter's Stripe Express dashboard (balance, payouts, bank). */
export async function payoutDashboardUrl(): Promise<string> {
  const { url } = await callFunction<{ url: string }>(supabase, "porter-payouts", { action: "dashboard" });
  return url;
}
