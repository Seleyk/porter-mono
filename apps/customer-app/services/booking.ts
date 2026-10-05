import { supabase } from "@/lib/supabase";
import { MIAMI_CENTER, formatBookingNotes, type PorterLocation, type Profile, type ServiceRequest } from "@porter/shared";
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

// Fallback when the route has no coordinates (Miami launch area).
const [FALLBACK_LNG, FALLBACK_LAT] = MIAMI_CENTER;

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
  fareUSD: number;
}

export async function createBooking(params: CreateBookingParams): Promise<ServiceRequest> {
  const basePrice = params.fareUSD;
  const itemCount = params.itemCounts.large + params.itemCounts.standard + params.itemCounts.small;

  const notes = formatBookingNotes(params.specialRequests, {
    speed: params.deliverySpeed,
    dropoff: params.dropoffMethod,
    counts: params.itemCounts,
    hub: params.selectedBoxName ?? undefined,
  });

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: params.customerId,
      service_type: toServiceType(params.itemType),
      item_count: Math.max(1, itemCount),
      item_size: toDominantSize(params.itemCounts),
      pickup_address: params.pickup,
      pickup_latitude: params.pickupCoords?.lat ?? FALLBACK_LAT,
      pickup_longitude: params.pickupCoords?.lng ?? FALLBACK_LNG,
      dropoff_address: params.dropoff,
      dropoff_latitude: params.dropoffCoords?.lat ?? (FALLBACK_LAT + 0.01),
      dropoff_longitude: params.dropoffCoords?.lng ?? (FALLBACK_LNG + 0.005),
      base_price: basePrice,
      total_price: basePrice,
      special_instructions: notes,
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

// Job changes go through database functions that check who may do what
// (supabase/migrations/*_job_functions.sql).
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_request", { request_id: bookingId });
  if (error) throw error;
}

export async function addTip(bookingId: string, tipAmount: number): Promise<void> {
  const { error } = await supabase.rpc("add_tip", { request_id: bookingId, amount: tipAmount });
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

// ─── The assigned porter ──────────────────────────────────────────────────────
// The customer can read the porter's profile while they share a job, and
// their location while the job is accepted or picked up (RLS).

export type PorterSummary = Pick<
  Profile,
  "id" | "first_name" | "last_name" | "phone" | "avatar_url" | "vehicle_make" | "vehicle_model" | "vehicle_color" | "license_plate"
>;

export async function getPorterProfile(porterId: string): Promise<PorterSummary | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, avatar_url, vehicle_make, vehicle_model, vehicle_color, license_plate")
    .eq("id", porterId)
    .maybeSingle();
  return data;
}

export async function getPorterLocation(porterId: string): Promise<PorterLocation | null> {
  const { data } = await supabase.from("porter_locations").select("*").eq("porter_id", porterId).maybeSingle();
  return data;
}

export function subscribeToPorterLocation(porterId: string, onUpdate: (row: PorterLocation) => void) {
  const channel = supabase
    .channel(`porter-location:${porterId}:${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "porter_locations", filter: `porter_id=eq.${porterId}` },
      (payload) => {
        if (payload.new && "latitude" in payload.new) onUpdate(payload.new as PorterLocation);
      },
    )
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
}

/** A short-lived link to the porter's proof-of-delivery photo. */
export async function getProofPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("proof-of-delivery").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
