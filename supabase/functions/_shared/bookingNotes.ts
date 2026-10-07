// The booking flow stores a few choices that have no column yet (speed,
// drop-off method, item counts, Porter Box hub) as tags after the customer's
// note in service_requests.special_instructions, e.g.
//   "Leave with the concierge [speed:priority] [dropoff:door] [counts:L0/M1/S0]"
// These helpers write and read that format so neither app shows raw tags.

export type BookingNoteTags = {
  speed?: string;
  dropoff?: string;
  counts?: { large: number; standard: number; small: number };
  hub?: string;
};

export type ParsedBookingNotes = BookingNoteTags & { note: string | null };

export function formatBookingNotes(note: string | null | undefined, tags: BookingNoteTags): string | null {
  const parts: string[] = [];
  if (note?.trim()) parts.push(note.trim());
  if (tags.speed) parts.push(`[speed:${tags.speed}]`);
  if (tags.dropoff) parts.push(`[dropoff:${tags.dropoff}]`);
  if (tags.counts) {
    const c = tags.counts;
    parts.push(`[counts:L${c.large}/M${c.standard}/S${c.small}]`);
  }
  if (tags.hub) parts.push(`[hub:${tags.hub}]`);
  return parts.join(" ") || null;
}

const TAG = /\[(speed|dropoff|counts|hub):([^\]]*)\]/g;

export function parseBookingNotes(text: string | null | undefined): ParsedBookingNotes {
  const result: ParsedBookingNotes = { note: null };
  if (!text) return result;
  for (const [, key, value] of text.matchAll(TAG)) {
    if (key === "counts") {
      const m = value.match(/^L(\d+)\/M(\d+)\/S(\d+)$/);
      if (m) result.counts = { large: +m[1], standard: +m[2], small: +m[3] };
    } else {
      result[key as "speed" | "dropoff" | "hub"] = value;
    }
  }
  const note = text.replace(TAG, "").replace(/\s+/g, " ").trim();
  result.note = note || null;
  return result;
}
