import { supabase } from "@/lib/supabase";
import { callFunction, type PorterLocation, type Profile, type ServiceRequest } from "@porter/shared";
import type { DeliverySpeed, ItemType, LatLng } from "@/store/bookingStore";

// ─── Pricing, booking and payment ─────────────────────────────────────────────
// Prices are calculated by the server and bookings are created there, with a
// card hold (supabase/functions/create-booking). The card is only charged when
// the porter completes the job, and the hold is released on cancel.

export type QuotedSpeed = { priceUSD: number; porterPayoutUSD: number };
export interface DeliveryQuote {
  distanceMiles: number;
  durationMinutes: number;
  prices: Record<DeliverySpeed, QuotedSpeed>;
}

type Counts = { large: number; standard: number; small: number };

export function quoteDelivery(params: {
  pickup: LatLng;
  dropoff: LatLng;
  itemValueUSD: number | null;
  itemCounts: Counts;
}): Promise<DeliveryQuote> {
  return callFunction(supabase, "quote-delivery", params);
}

interface CreateBookingParams {
  pickup: string;
  dropoff: string;
  pickupCoords: LatLng;
  dropoffCoords: LatLng;
  itemType: ItemType;
  itemCounts: Counts;
  itemValueUSD: number | null;
  specialRequests: string;
  dropoffMethod: "door" | "box";
  selectedBoxName: string | null;
  deliverySpeed: DeliverySpeed;
}

export interface PendingBooking {
  bookingId: string;
  clientSecret: string;
  amountUSD: number;
}

/** Saves an unpaid booking and returns the payment to confirm with the payment sheet. */
export function createBooking(p: CreateBookingParams): Promise<PendingBooking> {
  return callFunction(supabase, "create-booking", {
    pickup: { address: p.pickup, ...p.pickupCoords },
    dropoff: { address: p.dropoff, ...p.dropoffCoords },
    itemType: p.itemType,
    itemCounts: p.itemCounts,
    itemValueUSD: p.itemValueUSD,
    speed: p.deliverySpeed,
    dropoffMethod: p.dropoffMethod,
    hubName: p.selectedBoxName,
    specialRequests: p.specialRequests,
  });
}

/** After the payment sheet succeeds: puts the booking on the porters' job board. */
export async function confirmBooking(bookingId: string): Promise<ServiceRequest> {
  const { booking } = await callFunction<{ booking: ServiceRequest }>(supabase, "confirm-booking", { bookingId });
  return booking;
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
    .neq("payment_status", "pending") // drop bookings whose payment was never confirmed
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Cancels the booking and releases the card hold. */
export async function cancelBooking(bookingId: string): Promise<void> {
  await callFunction(supabase, "cancel-booking", { bookingId });
}

/** Starts a tip payment; confirm it with the payment sheet, then call confirmTip. */
export async function startTip(bookingId: string, amountUSD: number): Promise<string> {
  const { clientSecret } = await callFunction<{ clientSecret: string }>(supabase, "add-tip", { bookingId, amountUSD });
  return clientSecret;
}

export async function confirmTip(bookingId: string): Promise<void> {
  await callFunction(supabase, "add-tip", { bookingId, confirm: true });
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
