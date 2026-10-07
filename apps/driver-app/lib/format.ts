import { PORTER_RATES, parseBookingNotes, type ServiceRequest } from "@porter/shared";

export function money(n: number | null | undefined): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

/**
 * What the porter earns for a job: their share of the price (set by the
 * server when the job is booked) plus any tip.
 */
export function earnings(job: { porter_payout?: number | null; base_price?: number | null; tip_amount?: number | null }): number {
  const share = job.porter_payout ?? (job.base_price ?? 0) * PORTER_RATES.DRIVER_PCT;
  return Math.round((share + (job.tip_amount ?? 0)) * 100) / 100;
}

const SERVICE_LABELS: Record<string, string> = {
  luggage: "Luggage",
  shopping: "Shopping",
  packages: "Packages",
};

export function serviceLabel(type: string): string {
  return SERVICE_LABELS[type] ?? type;
}

export function itemSummary(job: ServiceRequest): string {
  const count = job.item_count ?? 1;
  const size = job.item_size ? ` · ${job.item_size}` : "";
  return `${serviceLabel(job.service_type)} · ${count} item${count === 1 ? "" : "s"}${size}`;
}

/** Straight-line distance in miles between two points. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatMiles(mi: number): string {
  return mi < 0.1 ? "nearby" : `${mi.toFixed(1)} mi`;
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function pickupOf(job: ServiceRequest): [number, number] {
  return [job.pickup_longitude, job.pickup_latitude];
}

export function dropoffOf(job: ServiceRequest): [number, number] {
  return [job.dropoff_longitude, job.dropoff_latitude];
}

/** The customer's note and the booking choices stored alongside it. */
export function jobDetails(job: ServiceRequest) {
  const parsed = parseBookingNotes(job.special_instructions);
  const handoff =
    parsed.dropoff === "box" ? `Porter Box${parsed.hub ? ` · ${parsed.hub}` : ""}` : parsed.dropoff === "door" ? "Hand to customer at the door" : null;
  const speed = parsed.speed ? parsed.speed[0].toUpperCase() + parsed.speed.slice(1) : null;
  return { note: parsed.note, handoff, speed };
}
