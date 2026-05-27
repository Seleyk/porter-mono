import { supabase } from "@/lib/supabase";
import { ServiceRequest } from "@/lib/database.types";
import { ItemType, DeliverySpeed } from "@/store/bookingStore";

type ServiceType = "luggage" | "shopping" | "packages";
type ItemSize = "small" | "medium" | "large";

function toServiceType(itemType: ItemType): ServiceType {
  if (itemType === "luggage") return "luggage";
  if (itemType === "shopping") return "shopping";
  return "packages"; // parcels + other
}

function toDominantSize(counts: { large: number; standard: number; small: number }): ItemSize {
  if (counts.large >= counts.standard && counts.large >= counts.small) return "large";
  if (counts.small > counts.large && counts.small >= counts.standard) return "small";
  return "medium";
}

const BASE_PRICES: Record<DeliverySpeed, number> = {
  priority: 28,
  standard: 18,
  scheduled: 16,
};

// Placeholder until Mapbox geocoding is wired — defaults to Midtown Manhattan
const NYC_LAT = 40.7549;
const NYC_LNG = -73.984;

interface CreateBookingParams {
  customerId: string;
  pickup: string;
  dropoff: string;
  pickupCoords?: { lat: number; lng: number } | null;
  dropoffCoords?: { lat: number; lng: number } | null;
  itemType: ItemType;
  itemCounts: { large: number; standard: number; small: number };
  specialRequests: string;
  dropoffMethod: "door" | "box";
  selectedBoxName: string | null;
  deliverySpeed: DeliverySpeed;
}

export async function createBooking(params: CreateBookingParams): Promise<ServiceRequest> {
  const basePrice = BASE_PRICES[params.deliverySpeed];
  const itemCount = params.itemCounts.large + params.itemCounts.standard + params.itemCounts.small;

  // Serialize extra metadata alongside any user notes
  const metaParts: string[] = [];
  if (params.specialRequests) metaParts.push(params.specialRequests);
  metaParts.push(
    `[speed:${params.deliverySpeed}]`,
    `[dropoff:${params.dropoffMethod}]`,
    `[counts:L${params.itemCounts.large}/M${params.itemCounts.standard}/S${params.itemCounts.small}]`,
  );
  if (params.selectedBoxName) metaParts.push(`[hub:${params.selectedBoxName}]`);

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: params.customerId,
      service_type: toServiceType(params.itemType),
      item_count: Math.max(1, itemCount),
      item_size: toDominantSize(params.itemCounts),
      pickup_address: params.pickup,
      pickup_latitude: params.pickupCoords?.lat ?? NYC_LAT,
      pickup_longitude: params.pickupCoords?.lng ?? NYC_LNG,
      dropoff_address: params.dropoff,
      dropoff_latitude: params.dropoffCoords?.lat ?? (NYC_LAT + 0.01),
      dropoff_longitude: params.dropoffCoords?.lng ?? (NYC_LNG + 0.005),
      base_price: basePrice,
      total_price: basePrice,
      special_instructions: metaParts.join(" ") || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBooking(bookingId: string): Promise<ServiceRequest | null> {
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", bookingId)
    .single();
  return data ?? null;
}

export async function getCustomerBookings(customerId: string): Promise<ServiceRequest[]> {
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (error) throw error;
}

export async function addTip(bookingId: string, tipAmount: number): Promise<void> {
  const booking = await getBooking(bookingId);
  if (!booking) return;
  const { error } = await supabase
    .from("service_requests")
    .update({
      tip_amount: tipAmount,
      total_price: (booking.base_price ?? 0) + tipAmount,
    })
    .eq("id", bookingId);
  if (error) throw error;
}

// Realtime subscription to booking status changes
export function subscribeToBooking(
  bookingId: string,
  onUpdate: (row: ServiceRequest) => void,
) {
  const channel = supabase
    .channel(`booking:${bookingId}:${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "service_requests",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => onUpdate(payload.new as ServiceRequest),
    )
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
}
