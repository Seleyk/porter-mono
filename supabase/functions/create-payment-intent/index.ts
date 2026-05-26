import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { amount } = await req.json();
    if (!amount || typeof amount !== "number") {
      return new Response(
        JSON.stringify({ error: "amount (number, in cents) is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ clientSecret: intent.client_secret }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
