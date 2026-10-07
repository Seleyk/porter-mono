import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type PorterSupabaseClient = SupabaseClient<Database>;

/** Where the auth session is persisted (e.g. an expo-secure-store adapter). */
export type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Typed Supabase client with the session settings both mobile apps use.
 * Each app passes its own storage so this package stays free of native modules.
 */
export function createPorterClient(url: string, key: string, storage: AuthStorage): PorterSupabaseClient {
  return createClient<Database>(url, key, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Calls one of our edge functions as the signed-in user. Throws an Error with
 * the function's own message (they return `{ error }` with a readable text).
 */
export async function callFunction<T>(client: SupabaseClient<any>, name: string, body: unknown): Promise<T> {
  const { data, error } = await client.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    let message = "Something went wrong. Please try again.";
    try {
      const payload: any = await (error as { context?: Response }).context?.json();
      if (payload?.error) message = payload.error;
    } catch {
      // not a JSON error body
    }
    throw new Error(message);
  }
  return data as T;
}
