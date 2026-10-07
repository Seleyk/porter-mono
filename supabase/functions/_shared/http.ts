// Helpers shared by the edge functions: CORS, JSON responses, the signed-in
// user, Supabase clients and Stripe.

import Stripe from "npm:stripe@14";
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** An error whose message is safe to show the customer or porter. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  // Same API version as create-porter-box-order (newer than stripe@14's typings).
  apiVersion: "2024-04-10" as Stripe.LatestApiVersion,
  httpClient: Stripe.createFetchHttpClient(),
});

/** Acts as the caller: RLS and the job functions' own checks apply. */
export function userClient(req: Request): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
}

/** Service role: bypasses RLS. Only for writes the caller isn't allowed to make. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });
}

export async function requireUser(db: SupabaseClient): Promise<User> {
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new HttpError(401, "Please sign in again.");
  return user;
}

/** Wraps a handler with CORS preflight and error handling. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  });
}

/** Postgres errors raised by the job functions carry a readable message. */
export function rpcError(error: { message: string; code?: string }): HttpError {
  const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 400;
  return new HttpError(status, error.message);
}

export const toCents = (usd: number) => Math.round(usd * 100);

// Payment status on service_requests (the column's check constraint predates
// this flow, so its existing values are reused):
//   pending    no payment yet (the customer hasn't confirmed the card)
//   processing card authorized, money on hold; the job is on the job board
//   completed  captured when the porter completed the job
//   refunded   hold released (or refunded) because the job was cancelled
//   failed     capture failed
export type PaymentStatus = "pending" | "processing" | "completed" | "refunded" | "failed";
