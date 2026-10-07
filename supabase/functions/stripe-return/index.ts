// Where Stripe sends a porter's browser after payout sign-up. Redirects to the
// driver app (porterdriver://payouts), which refreshes the payout status.
// Public (no sign-in): it only redirects. (Supabase serves function responses
// as plain text, so this is a redirect rather than an HTML page.)

Deno.serve((req) => {
  const step = new URL(req.url).searchParams.get("step") === "refresh" ? "refresh" : "done";
  const target = `porterdriver://payouts?step=${step}`;
  return new Response(`Return to the Porter Driver app: ${target}`, {
    status: 302,
    headers: { Location: target, "Content-Type": "text/plain; charset=utf-8" },
  });
});
