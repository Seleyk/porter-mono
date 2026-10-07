// Prices a door-to-door delivery for each speed. The edge functions use this
// to charge, and the customer app shows the quote they return, so what the
// customer sees is what they pay.

import { calculateFare, PORTER_RATES, type LuggageSize } from "./porterFare.ts";

export type DeliverySpeed = "priority" | "standard" | "scheduled";
export const DELIVERY_SPEEDS: DeliverySpeed[] = ["priority", "standard", "scheduled"];

export const SPEED_MULTIPLIERS: Record<DeliverySpeed, number> = {
  priority: 1.0,
  standard: 0.85,
  scheduled: 0.75,
};

/** Declared value used when the customer didn't enter one (lowest tier). */
export const DEFAULT_ITEM_VALUE_USD = 50;

export interface ItemCounts {
  large: number;
  standard: number;
  small: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TierPrice {
  priceUSD: number;
  /** The porter's share of the price (PORTER_RATES.DRIVER_PCT). */
  porterPayoutUSD: number;
}

export interface DeliveryQuote {
  distanceMiles: number;
  durationMinutes: number;
  prices: Record<DeliverySpeed, TierPrice>;
}

export function luggageSizeFor(counts: ItemCounts): LuggageSize {
  const total = counts.large + counts.standard + counts.small;
  if (total === 0) return "NONE";
  if (counts.large > 0 || total >= 3) return "LARGE";
  return "SMALL";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function quoteDelivery(input: {
  distanceMiles: number;
  durationMinutes: number;
  itemValueUSD?: number | null;
  itemCounts: ItemCounts;
}): DeliveryQuote {
  const result = calculateFare({
    service: "DELIVERY",
    itemValueUSD: Math.max(DEFAULT_ITEM_VALUE_USD, input.itemValueUSD ?? DEFAULT_ITEM_VALUE_USD),
    distanceMiles: input.distanceMiles,
    durationMinutes: input.durationMinutes,
    luggageSize: luggageSizeFor(input.itemCounts),
  });
  if (!result.success) throw new Error(result.error.message);

  const base = result.fare.totalFareUSD;
  const prices = {} as Record<DeliverySpeed, TierPrice>;
  for (const speed of DELIVERY_SPEEDS) {
    const priceUSD = round2(base * SPEED_MULTIPLIERS[speed]);
    prices[speed] = { priceUSD, porterPayoutUSD: round2(priceUSD * PORTER_RATES.DRIVER_PCT) };
  }
  return {
    distanceMiles: round2(input.distanceMiles),
    durationMinutes: Math.round(input.durationMinutes),
    prices,
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────

const MAPBOX_DIRECTIONS = "https://api.mapbox.com/directions/v5/mapbox/driving";
const ROAD_FACTOR = 1.3; // straight line → typical city driving distance
const CITY_MPH = 15;

function straightLineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Driving distance and time between two points. Uses the Mapbox Directions
 * API (same profile as the app's map) when a token is set, otherwise an
 * estimate from the straight-line distance.
 */
export async function routeBetween(
  from: LatLng,
  to: LatLng,
  mapboxToken?: string,
): Promise<{ distanceMiles: number; durationMinutes: number }> {
  if (mapboxToken) {
    try {
      const url =
        `${MAPBOX_DIRECTIONS}/${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=false&steps=false&access_token=${mapboxToken}`;
      const res = await fetch(url);
      if (res.ok) {
        const json: any = await res.json();
        const route = json.routes?.[0];
        if (route) return { distanceMiles: route.distance / 1609.34, durationMinutes: route.duration / 60 };
      }
    } catch {
      // fall through to the estimate
    }
  }
  const miles = straightLineMiles(from, to) * ROAD_FACTOR;
  return { distanceMiles: miles, durationMinutes: (miles / CITY_MPH) * 60 };
}

export function isLatLng(v: unknown): v is LatLng {
  const p = v as LatLng;
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}

export function isItemCounts(v: unknown): v is ItemCounts {
  const c = v as ItemCounts;
  const ok = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 50;
  return !!c && ok(c.large) && ok(c.standard) && ok(c.small);
}
