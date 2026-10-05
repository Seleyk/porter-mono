import { useEffect, useState } from "react";
import type { ServiceRequest } from "@porter/shared";
import {
  getBooking,
  getPorterLocation,
  getPorterProfile,
  subscribeToBooking,
  subscribeToPorterLocation,
  type PorterSummary,
} from "@/services/booking";

export type LivePosition = { lng: number; lat: number; heading: number | null; updatedAt: string | null };

const POLL_MS = 15_000;
const TRACKED_STATUSES = new Set(["accepted", "picked_up"]);

/**
 * A booking as the porter works it: the row itself, the assigned porter's
 * profile, and their live position while they're on the job.
 */
export function useLiveBooking(bookingId: string | null) {
  const [booking, setBooking] = useState<ServiceRequest | null>(null);
  const [porter, setPorter] = useState<PorterSummary | null>(null);
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [loading, setLoading] = useState(true);

  // The booking row, kept current over realtime.
  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    let active = true;
    const load = () => getBooking(bookingId).then((row) => active && row && setBooking(row));
    load().finally(() => active && setLoading(false));
    const sub = subscribeToBooking(bookingId, (row) => setBooking(row));
    // Safety net in case a realtime message is missed (e.g. the phone slept).
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      sub.unsubscribe();
      clearInterval(timer);
    };
  }, [bookingId]);

  const porterId = booking?.porter_id ?? null;
  const tracked = !!booking?.status && TRACKED_STATUSES.has(booking.status);

  // Who the porter is.
  useEffect(() => {
    if (!porterId) {
      setPorter(null);
      return;
    }
    let active = true;
    getPorterProfile(porterId).then((p) => active && setPorter(p));
    return () => {
      active = false;
    };
  }, [porterId]);

  // Where the porter is, while they're on this job.
  useEffect(() => {
    if (!porterId || !tracked) {
      setPosition(null);
      return;
    }
    let active = true;
    const apply = (row: { longitude: number; latitude: number; heading: number | null; updated_at: string | null }) =>
      active && setPosition({ lng: row.longitude, lat: row.latitude, heading: row.heading, updatedAt: row.updated_at });
    getPorterLocation(porterId).then((row) => row && apply(row));
    const sub = subscribeToPorterLocation(porterId, apply);
    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, [porterId, tracked]);

  return { booking, porter, position, loading };
}
