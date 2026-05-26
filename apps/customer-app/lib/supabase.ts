import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Database } from "./database.types";

// Adapter so Supabase sessions persist securely on device
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY in .env");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
