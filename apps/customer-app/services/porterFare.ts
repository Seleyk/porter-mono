/**
 * ============================================================
 * PORTER FARE ALGORITHM v1.0
 * ============================================================
 * Production-ready fare calculation engine for Porter app.
 * Covers all three services: Delivery, Returns, Porter Boxes.
 *
 * Author:    Porter Engineering (Steven)
 * Model:     Based on verified pricing model v9.0
 * Date:      March 2026
 * Patent:    Pending — Porter provisional patent on file
 *
 * USAGE:
 *   import { calculateFare } from './porterFare'
 *   const result = calculateFare(request)
 * ============================================================
 */

// ── CONSTANTS ─────────────────────────────────────────────────────────────

/**
 * These are the master rate constants.
 * All are configurable by Porter ops team — do NOT hardcode
 * these values anywhere else in the app. Always import from here.
 */
export const PORTER_RATES = {
  // Fare components
  DISTANCE_RATE:     0.65,   // $ per mile
  TIME_RATE:         0.45,   // $ per minute

  // Modifiers
  RETURNS_MODIFIER:  0.90,   // 0.9× applied to full delivery fare
  RETURNS_MIN_FARE:  13.00,  // Minimum fare floor for Returns service

  // Luggage multipliers
  LUGGAGE: {
    NONE:           1.00,   // No bags / N/A
    SMALL:          1.15,   // 1–2 bags
    LARGE:          1.35,   // 3+ bags
  },

  // Revenue split
  DRIVER_PCT:        0.65,   // 65% of fare to driver
  PLATFORM_PCT:      0.35,   // 35% stays on platform

  // Box storage
  BOX_STORAGE_RATE:  9.99,   // $ per day — storage only
  BOX_STORAGE_PROFIT_PCT: 0.75, // 75% profit on storage (no driver)
  BOX_STORAGE_OPEX_PCT:   0.25, // 25% opex on storage

  // Payment processing (Stripe)
  STRIPE_PCT:        0.029,  // 2.9%
  STRIPE_FLAT:       0.30,   // $0.30 per transaction

  // Surge (optional — set to 0 to disable)
  SURGE_MULTIPLIER:  0.00,   // 0% default (enable during peak: 0.04 = 4%)
} as const;


// ── ITEM VALUE TIERS ──────────────────────────────────────────────────────

/**
 * Value-based pricing tiers.
 * Base fare is calculated as a percentage of declared item value,
 * OR a flat fee for the lowest tier.
 *
 * Higher item value = higher base fare = higher driver incentive
 * to handle items with care.
 */
export const ITEM_VALUE_TIERS = [
  { label: '$50–75',    minValue: 50,   maxValue: 75,   type: 'flat' as const, rate: 13.00 },
  { label: '$76–125',   minValue: 76,   maxValue: 125,  type: 'pct'  as const, rate: 0.13  },
  { label: '$126–200',  minValue: 126,  maxValue: 200,  type: 'pct'  as const, rate: 0.11  },
  { label: '$201–300',  minValue: 201,  maxValue: 300,  type: 'pct'  as const, rate: 0.10  },
  { label: '$301–400',  minValue: 301,  maxValue: 400,  type: 'pct'  as const, rate: 0.09  },
  { label: '$401–500',  minValue: 401,  maxValue: 500,  type: 'pct'  as const, rate: 0.08  },
  { label: '$501+',     minValue: 501,  maxValue: Infinity, type: 'pct' as const, rate: 0.07 },
] as const;


// ── TYPES ─────────────────────────────────────────────────────────────────

export type ServiceType = 'DELIVERY' | 'RETURNS' | 'BOX_STORAGE' | 'BOX_TRANSIT_DROP' | 'BOX_TRANSIT_PICKUP';
export type LuggageSize = 'NONE' | 'SMALL' | 'LARGE';

export interface FareRequest {
  service:         ServiceType;

  // Required for DELIVERY, RETURNS, BOX_TRANSIT_DROP, BOX_TRANSIT_PICKUP
  itemValueUSD?:   number;    // Declared value of items being transported
  distanceMiles?:  number;    // Route distance in miles
  durationMinutes?: number;   // Estimated job duration in minutes
  luggageSize?:    LuggageSize; // Luggage modifier selection

  // Required for BOX_STORAGE only
  storageDays?:    number;    // Number of days of storage requested

  // Optional overrides (for surge pricing, promos, etc.)
  surgeMultiplier?:  number;  // Override default surge (e.g. 0.15 for 15% surge)
  promoDiscountUSD?: number;  // Flat dollar discount to apply after calc
}

export interface FareBreakdown {
  // Input echo
  service:          ServiceType;
  itemValueUSD:     number;
  distanceMiles:    number;
  durationMinutes:  number;
  luggageSize:      LuggageSize;
  luggageMultiplier: number;
  activeTier:       string;

  // Fare components
  baseFareUSD:      number;   // From item value tier
  distanceChargeUSD: number;  // Miles × rate
  timeChargeUSD:    number;   // Minutes × rate
  subTotalUSD:      number;   // Before luggage and service modifier
  luggageAdjUSD:    number;   // Additional from luggage modifier
  serviceModifier:  number;   // 1.0 for delivery, 0.9 for returns
  preSurgeUSD:      number;   // After modifiers, before surge

  // Surge
  surgeMultiplier:  number;
  surgeAmountUSD:   number;

  // Final fare
  totalFareUSD:     number;   // What the customer pays
  minimumFareApplied: boolean; // Whether min fare floor was enforced

  // Revenue split
  driverPayoutUSD:  number;   // 65% of fare
  platformGrossUSD: number;   // 35% of fare
  stripeFeesUSD:    number;   // Processing cost
  platformNetUSD:   number;   // Porter keeps after Stripe

  // For box storage only
  storageGrossUSD?: number;
  storageOpexUSD?:  number;
  storageProfitUSD?: number;
}

export interface FareError {
  code:    string;
  message: string;
}

export type FareResult =
  | { success: true;  fare: FareBreakdown }
  | { success: false; error: FareError };


// ── INTERNAL HELPERS ──────────────────────────────────────────────────────

function getTier(itemValueUSD: number) {
  const tier = ITEM_VALUE_TIERS.find(
    t => itemValueUSD >= t.minValue && itemValueUSD <= t.maxValue
  );
  if (!tier) return null;
  return tier;
}

function computeBaseFare(itemValueUSD: number): { baseFare: number; tier: typeof ITEM_VALUE_TIERS[number] | null } {
  const tier = getTier(itemValueUSD);
  if (!tier) return { baseFare: 0, tier: null };
  const baseFare = tier.type === 'flat'
    ? tier.rate
    : itemValueUSD * tier.rate;
  return { baseFare, tier };
}

function computeStripe(fareUSD: number): number {
  return fareUSD * PORTER_RATES.STRIPE_PCT + PORTER_RATES.STRIPE_FLAT;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function validateDeliveryInputs(req: FareRequest): FareError | null {
  if (!req.itemValueUSD || req.itemValueUSD < 50) {
    return { code: 'INVALID_ITEM_VALUE', message: 'Item value must be at least $50.' };
  }
  if (!req.distanceMiles || req.distanceMiles <= 0) {
    return { code: 'INVALID_DISTANCE', message: 'Distance must be greater than 0 miles.' };
  }
  if (!req.durationMinutes || req.durationMinutes <= 0) {
    return { code: 'INVALID_DURATION', message: 'Duration must be greater than 0 minutes.' };
  }
  return null;
}


// ── MAIN FARE CALCULATION ─────────────────────────────────────────────────

/**
 * calculateFare()
 *
 * The single entry point for all Porter fare calculations.
 * Pass a FareRequest and receive a FareResult.
 *
 * @example — Delivery
 * const result = calculateFare({
 *   service: 'DELIVERY',
 *   itemValueUSD: 150,
 *   distanceMiles: 8,
 *   durationMinutes: 22,
 *   luggageSize: 'SMALL',
 * });
 *
 * @example — Returns
 * const result = calculateFare({
 *   service: 'RETURNS',
 *   itemValueUSD: 80,
 *   distanceMiles: 5,
 *   durationMinutes: 15,
 *   luggageSize: 'NONE',
 * });
 *
 * @example — Box Storage
 * const result = calculateFare({
 *   service: 'BOX_STORAGE',
 *   storageDays: 2,
 * });
 *
 * @example — Drop-to-Box (Driver delivers to Porter Box)
 * const result = calculateFare({
 *   service: 'BOX_TRANSIT_DROP',
 *   itemValueUSD: 200,
 *   distanceMiles: 6,
 *   durationMinutes: 18,
 *   luggageSize: 'SMALL',
 * });
 */
export function calculateFare(req: FareRequest): FareResult {

  // ── BOX STORAGE (special path — no driver, flat rate) ──
  if (req.service === 'BOX_STORAGE') {
    const days = req.storageDays ?? 1;
    if (days <= 0) {
      return { success: false, error: { code: 'INVALID_STORAGE_DAYS', message: 'Storage days must be at least 1.' } };
    }
    const totalFare = round2(PORTER_RATES.BOX_STORAGE_RATE * days);
    const stripe    = round2(computeStripe(totalFare));
    const opex      = round2(totalFare * PORTER_RATES.BOX_STORAGE_OPEX_PCT);
    const profit    = round2(totalFare * PORTER_RATES.BOX_STORAGE_PROFIT_PCT - stripe);

    return {
      success: true,
      fare: {
        service:             'BOX_STORAGE',
        itemValueUSD:        0,
        distanceMiles:       0,
        durationMinutes:     0,
        luggageSize:         'NONE',
        luggageMultiplier:   1.0,
        activeTier:          'N/A — flat storage rate',
        baseFareUSD:         PORTER_RATES.BOX_STORAGE_RATE,
        distanceChargeUSD:   0,
        timeChargeUSD:       0,
        subTotalUSD:         totalFare,
        luggageAdjUSD:       0,
        serviceModifier:     1.0,
        preSurgeUSD:         totalFare,
        surgeMultiplier:     0,
        surgeAmountUSD:      0,
        totalFareUSD:        totalFare,
        minimumFareApplied:  false,
        driverPayoutUSD:     0,           // No driver on storage
        platformGrossUSD:    totalFare,
        stripeFeesUSD:       stripe,
        platformNetUSD:      profit,
        storageGrossUSD:     totalFare,
        storageOpexUSD:      opex,
        storageProfitUSD:    profit,
      }
    };
  }

  // ── DELIVERY, RETURNS, BOX TRANSIT (all require route inputs) ──
  const validationError = validateDeliveryInputs(req);
  if (validationError) return { success: false, error: validationError };

  const itemValue  = req.itemValueUSD!;
  const distance   = req.distanceMiles!;
  const duration   = req.durationMinutes!;
  const lugSize    = req.luggageSize ?? 'NONE';
  const lugMult    = PORTER_RATES.LUGGAGE[lugSize];
  const surge      = req.surgeMultiplier ?? PORTER_RATES.SURGE_MULTIPLIER;

  // Step 1 — Base fare from item value tier
  const { baseFare, tier } = computeBaseFare(itemValue);
  if (!tier) {
    return { success: false, error: { code: 'ITEM_VALUE_OUT_OF_RANGE', message: `Item value $${itemValue} is below the minimum of $50.` } };
  }

  // Step 2 — Distance and time charges
  const distanceCharge = round2(distance * PORTER_RATES.DISTANCE_RATE);
  const timeCharge     = round2(duration * PORTER_RATES.TIME_RATE);

  // Step 3 — Sub-total (before luggage)
  const subTotal = round2(baseFare + distanceCharge + timeCharge);

  // Step 4 — Apply luggage modifier
  const withLuggage = round2(subTotal * lugMult);
  const luggageAdj  = round2(withLuggage - subTotal);

  // Step 5 — Apply service modifier
  let serviceModifier = 1.0;
  if (req.service === 'RETURNS') {
    serviceModifier = PORTER_RATES.RETURNS_MODIFIER;
  }
  const postModifier = round2(withLuggage * serviceModifier);

  // Step 6 — Enforce minimum fare for Returns
  let finalPreSurge = postModifier;
  let minimumFareApplied = false;
  if (req.service === 'RETURNS' && postModifier < PORTER_RATES.RETURNS_MIN_FARE) {
    finalPreSurge = PORTER_RATES.RETURNS_MIN_FARE;
    minimumFareApplied = true;
  }

  // Step 7 — Apply surge
  const surgeAmount = round2(finalPreSurge * surge);
  let totalFare     = round2(finalPreSurge + surgeAmount);

  // Step 8 — Apply promo discount if provided
  if (req.promoDiscountUSD && req.promoDiscountUSD > 0) {
    totalFare = round2(Math.max(0, totalFare - req.promoDiscountUSD));
  }

  // Step 9 — Calculate revenue split
  const driverPayout    = round2(totalFare * PORTER_RATES.DRIVER_PCT);
  const platformGross   = round2(totalFare * PORTER_RATES.PLATFORM_PCT);
  const stripeFees      = round2(computeStripe(totalFare));
  const platformNet     = round2(platformGross - stripeFees);

  return {
    success: true,
    fare: {
      service:             req.service,
      itemValueUSD:        itemValue,
      distanceMiles:       distance,
      durationMinutes:     duration,
      luggageSize:         lugSize,
      luggageMultiplier:   lugMult,
      activeTier:          tier.label,
      baseFareUSD:         round2(baseFare),
      distanceChargeUSD:   distanceCharge,
      timeChargeUSD:       timeCharge,
      subTotalUSD:         subTotal,
      luggageAdjUSD:       luggageAdj,
      serviceModifier,
      preSurgeUSD:         finalPreSurge,
      surgeMultiplier:     surge,
      surgeAmountUSD:      surgeAmount,
      totalFareUSD:        totalFare,
      minimumFareApplied,
      driverPayoutUSD:     driverPayout,
      platformGrossUSD:    platformGross,
      stripeFeesUSD:       stripeFees,
      platformNetUSD:      platformNet,
    }
  };
}


// ── CONVENIENCE WRAPPERS ──────────────────────────────────────────────────

/**
 * getDeliveryFare() — Quick wrapper for standard delivery
 */
export function getDeliveryFare(
  itemValueUSD: number,
  distanceMiles: number,
  durationMinutes: number,
  luggageSize: LuggageSize = 'NONE'
): FareResult {
  return calculateFare({ service: 'DELIVERY', itemValueUSD, distanceMiles, durationMinutes, luggageSize });
}

/**
 * getReturnsFare() — Quick wrapper for Porter Returns
 */
export function getReturnsFare(
  itemValueUSD: number,
  distanceMiles: number,
  durationMinutes: number,
  luggageSize: LuggageSize = 'NONE'
): FareResult {
  return calculateFare({ service: 'RETURNS', itemValueUSD, distanceMiles, durationMinutes, luggageSize });
}

/**
 * getBoxStorageFare() — Quick wrapper for Porter Box storage
 */
export function getBoxStorageFare(storageDays: number = 1): FareResult {
  return calculateFare({ service: 'BOX_STORAGE', storageDays });
}

/**
 * getBoxTransitFare() — Quick wrapper for Drop-to-Box / Box-to-Door
 * Pricing is identical to delivery — box is just origin or destination
 */
export function getBoxTransitFare(
  direction: 'DROP' | 'PICKUP',
  itemValueUSD: number,
  distanceMiles: number,
  durationMinutes: number,
  luggageSize: LuggageSize = 'NONE'
): FareResult {
  return calculateFare({
    service: direction === 'DROP' ? 'BOX_TRANSIT_DROP' : 'BOX_TRANSIT_PICKUP',
    itemValueUSD,
    distanceMiles,
    durationMinutes,
    luggageSize,
  });
}

/**
 * applySurge() — Enable surge pricing during peak demand
 * Call this when demand spikes (e.g. Art Basel, boat show, holidays)
 * Returns a modified FareRequest with surge applied
 */
export function withSurge(req: FareRequest, surgeMultiplier: number): FareRequest {
  return { ...req, surgeMultiplier };
}

/**
 * withPromo() — Apply a promotional discount
 */
export function withPromo(req: FareRequest, discountUSD: number): FareRequest {
  return { ...req, promoDiscountUSD: discountUSD };
}

/**
 * getFareSummary() — Human-readable summary for display in app UI
 */
export function getFareSummary(fare: FareBreakdown): string {
  const lines: string[] = [
    `Service:       ${fare.service.replace(/_/g, ' ')}`,
    `Tier:          ${fare.activeTier}`,
    `Base Fare:     $${fare.baseFareUSD.toFixed(2)}`,
    `Distance:      $${fare.distanceChargeUSD.toFixed(2)} (${fare.distanceMiles} mi × $${PORTER_RATES.DISTANCE_RATE})`,
    `Time:          $${fare.timeChargeUSD.toFixed(2)} (${fare.durationMinutes} min × $${PORTER_RATES.TIME_RATE})`,
  ];
  if (fare.luggageMultiplier !== 1.0) {
    lines.push(`Luggage (${fare.luggageSize}):  +$${fare.luggageAdjUSD.toFixed(2)} (×${fare.luggageMultiplier})`);
  }
  if (fare.serviceModifier !== 1.0) {
    lines.push(`Returns Mod:   ×${fare.serviceModifier}${fare.minimumFareApplied ? ' (min floor applied)' : ''}`);
  }
  if (fare.surgeMultiplier > 0) {
    lines.push(`Surge:         +$${fare.surgeAmountUSD.toFixed(2)} (${(fare.surgeMultiplier * 100).toFixed(0)}%)`);
  }
  lines.push(`─────────────────────────────`);
  lines.push(`TOTAL FARE:    $${fare.totalFareUSD.toFixed(2)}`);
  lines.push(`Driver Gets:   $${fare.driverPayoutUSD.toFixed(2)} (${(PORTER_RATES.DRIVER_PCT * 100).toFixed(0)}%)`);
  lines.push(`Porter Net:    $${fare.platformNetUSD.toFixed(2)}`);
  return lines.join('\n');
}


// ── TEST SUITE ────────────────────────────────────────────────────────────

/**
 * runTests()
 *
 * Steven — run this once during integration to verify the algorithm
 * matches the verified model numbers.
 *
 * Expected outputs match Porter Revenue Calculator v9.0.
 */
export function runTests(): void {
  console.log('═══════════════════════════════════════');
  console.log('  PORTER FARE ALGORITHM — TEST SUITE   ');
  console.log('═══════════════════════════════════════\n');

  const tests: Array<{ name: string; req: FareRequest; expectedFare: number; tolerance?: number }> = [
    {
      name: 'Delivery — $125 item, 11mi, 20min, 1-2 bags',
      req: { service: 'DELIVERY', itemValueUSD: 125, distanceMiles: 11, durationMinutes: 20, luggageSize: 'SMALL' },
      expectedFare: 37.26,
      tolerance: 0.10,
    },
    {
      name: 'Delivery — $125 item, 11mi, 20min, no bags',
      req: { service: 'DELIVERY', itemValueUSD: 125, distanceMiles: 11, durationMinutes: 20, luggageSize: 'NONE' },
      expectedFare: 32.40,
      tolerance: 0.10,
    },
    {
      name: 'Returns — $125 item, 11mi, 20min (×0.9)',
      req: { service: 'RETURNS', itemValueUSD: 125, distanceMiles: 11, durationMinutes: 20, luggageSize: 'NONE' },
      expectedFare: 29.16,
      tolerance: 0.10,
    },
    {
      name: 'Returns — Low value, min fare floor applies',
      req: { service: 'RETURNS', itemValueUSD: 50, distanceMiles: 2, durationMinutes: 8, luggageSize: 'NONE' },
      expectedFare: 13.00,
      tolerance: 0.01,
    },
    {
      name: 'Box Storage — 1 day',
      req: { service: 'BOX_STORAGE', storageDays: 1 },
      expectedFare: 9.99,
      tolerance: 0.01,
    },
    {
      name: 'Box Transit (Drop-to-Box) — same as delivery',
      req: { service: 'BOX_TRANSIT_DROP', itemValueUSD: 125, distanceMiles: 11, durationMinutes: 20, luggageSize: 'NONE' },
      expectedFare: 32.40,
      tolerance: 0.10,
    },
    {
      name: 'Delivery — $300 item, 15mi, 25min',
      req: { service: 'DELIVERY', itemValueUSD: 300, distanceMiles: 15, durationMinutes: 25, luggageSize: 'NONE' },
      expectedFare: 50.25,
      tolerance: 0.10,
    },
    {
      name: 'Delivery — with 4% surge',
      req: { service: 'DELIVERY', itemValueUSD: 125, distanceMiles: 11, durationMinutes: 20, luggageSize: 'NONE', surgeMultiplier: 0.04 },
      expectedFare: 33.70,
      tolerance: 0.10,
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const result = calculateFare(test.req);
    if (!result.success) {
      console.log(`❌ FAIL  ${test.name}`);
      console.log(`        Error: ${result.error.message}\n`);
      failed++;
      return;
    }
    const actual = result.fare.totalFareUSD;
    const tol    = test.tolerance ?? 0.02;
    const pass   = Math.abs(actual - test.expectedFare) <= tol;
    if (pass) {
      console.log(`✅ PASS  ${test.name}`);
      console.log(`        Fare: $${actual.toFixed(2)} (expected ~$${test.expectedFare.toFixed(2)})`);
      console.log(`        Driver: $${result.fare.driverPayoutUSD.toFixed(2)}  Porter net: $${result.fare.platformNetUSD.toFixed(2)}\n`);
      passed++;
    } else {
      console.log(`❌ FAIL  ${test.name}`);
      console.log(`        Got $${actual.toFixed(2)}, expected ~$${test.expectedFare.toFixed(2)}\n`);
      failed++;
    }
  });

  console.log('───────────────────────────────────────');
  console.log(`  Results: ${passed} passed / ${failed} failed`);
  console.log('───────────────────────────────────────\n');

  if (failed === 0) {
    console.log('  ✅ All tests passed. Safe to deploy.\n');
  } else {
    console.log('  ⚠️  Fix failures before deploying to production.\n');
  }
}


// ── RATE CONFIG UPDATER ───────────────────────────────────────────────────

/**
 * getRateConfig()
 *
 * Returns current rate configuration as a plain object.
 * Useful for displaying current rates in admin panel
 * or for logging purposes.
 */
export function getRateConfig() {
  return {
    distanceRatePerMile:   PORTER_RATES.DISTANCE_RATE,
    timeRatePerMinute:     PORTER_RATES.TIME_RATE,
    driverSplitPct:        PORTER_RATES.DRIVER_PCT * 100,
    platformSplitPct:      PORTER_RATES.PLATFORM_PCT * 100,
    returnsModifier:       PORTER_RATES.RETURNS_MODIFIER,
    returnsMinFare:        PORTER_RATES.RETURNS_MIN_FARE,
    luggageMultipliers:    PORTER_RATES.LUGGAGE,
    boxStorageRatePerDay:  PORTER_RATES.BOX_STORAGE_RATE,
    boxStorageProfitPct:   PORTER_RATES.BOX_STORAGE_PROFIT_PCT * 100,
    stripeRatePct:         PORTER_RATES.STRIPE_PCT * 100,
    stripeFlatFee:         PORTER_RATES.STRIPE_FLAT,
    surgeMultiplier:       PORTER_RATES.SURGE_MULTIPLIER,
    tiers:                 ITEM_VALUE_TIERS,
  };
}
