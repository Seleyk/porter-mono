import { supabase } from "@/lib/supabase";

export interface PorterBoxOrder {
  id: string;
  hub_id: string;
  pickup_code: string;
  dropped_at: string;
  collected_at: string | null;
  charge_cents: number;
  payment_status: string;
  is_collected: boolean;
  porter_hubs: { name: string; address: string } | null;
}

export async function fetchActivePorterBoxOrders(): Promise<PorterBoxOrder[]> {
  const { data, error } = await supabase
    .from("porter_box_orders")
    .select("*, porter_hubs(name, address)")
    .eq("is_collected", false)
    .order("dropped_at", { ascending: false });
  return error ? [] : (data as PorterBoxOrder[]);
}

export async function markOrderCollected(orderId: string) {
  return supabase
    .from("porter_box_orders")
    .update({ is_collected: true, collected_at: new Date().toISOString() })
    .eq("id", orderId);
}

export function formatDuration(droppedAt: string): string {
  const mins = Math.round((Date.now() - new Date(droppedAt).getTime()) / 60_000);
  if (mins < 60) return `${mins}m stored`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m stored` : `${h}h stored`;
}
