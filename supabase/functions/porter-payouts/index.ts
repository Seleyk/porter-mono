// A porter's payout account (Stripe Connect Express).
//
// POST { action: "status" }    → { state, ... }  refreshes from Stripe; pays owed jobs once enabled
// POST { action: "onboard" }   → { url }         Stripe's sign-up page (creates the account first time)
// POST { action: "dashboard" } → { url }         Stripe Express dashboard (balance, payouts, bank)
//
// state: "not_started" | "incomplete" (details missing) | "pending" (Stripe is
// verifying) | "enabled"

import { adminClient, HttpError, json, requireUser, serve, stripe, userClient } from "../_shared/http.ts";
import { payOwedJobs } from "../_shared/payouts.ts";

type State = "not_started" | "incomplete" | "pending" | "enabled";

serve(async (req) => {
  const db = userClient(req);
  const user = await requireUser(db);
  const { action = "status" } = await req.json().catch(() => ({}));

  const { data: profile } = await db
    .from("profiles")
    .select("id, user_type, verification_status, first_name, last_name, stripe_account_id, payouts_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.user_type !== "porter") throw new HttpError(403, "Only porters can set up payouts.");

  const admin = adminClient();
  let accountId: string | null = profile.stripe_account_id;

  if (action === "onboard") {
    if (profile.verification_status !== "approved") {
      throw new HttpError(403, "You can set up payouts once your account is approved.");
    }
    if (!accountId) {
      const account = await stripe.accounts.create(
        {
          type: "express",
          country: "US",
          email: user.email ?? undefined,
          business_type: "individual",
          individual: { first_name: profile.first_name, last_name: profile.last_name, email: user.email ?? undefined },
          capabilities: { transfers: { requested: true } },
          business_profile: { product_description: "Delivers items as a porter on Porter" },
          metadata: { porter_id: user.id },
        },
        { idempotencyKey: `connect-account-${user.id}` },
      );
      accountId = account.id;
      const { error } = await admin.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
      if (error) throw error;
    }
    const back = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-return`;
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${back}?step=refresh`,
      return_url: `${back}?step=done`,
    });
    return json({ url: link.url });
  }

  if (action === "dashboard") {
    if (!accountId) throw new HttpError(409, "Set up payouts first.");
    const link = await stripe.accounts.createLoginLink(accountId);
    return json({ url: link.url });
  }

  if (action !== "status") throw new HttpError(400, "Unknown action.");
  if (!accountId) return json({ state: "not_started" satisfies State });

  const account = await stripe.accounts.retrieve(accountId);
  const enabled = account.capabilities?.transfers === "active" && account.payouts_enabled === true;
  const state: State = enabled ? "enabled" : account.details_submitted ? "pending" : "incomplete";

  if (enabled !== profile.payouts_enabled) {
    const { error } = await admin.from("profiles").update({ payouts_enabled: enabled }).eq("id", user.id);
    if (error) throw error;
  }
  const paidNow = enabled ? await payOwedJobs(admin, user.id) : 0;

  return json({
    state,
    paidNow,
    requirementsDue: account.requirements?.currently_due?.length ?? 0,
  });
});
