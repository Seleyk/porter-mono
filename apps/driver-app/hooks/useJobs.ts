import { useCallback, useEffect, useRef, useState } from "react";
import type { ServiceRequest } from "@porter/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchActiveJob, fetchNearbyJobs, subscribeToJobs } from "@/services/jobs";
import { milesBetween } from "@/lib/format";

/** The porter's current job, kept fresh with realtime updates. */
export function useActiveJob() {
  const { user } = useAuth();
  const [job, setJob] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setJob(await fetchActiveJob(user.id));
    } catch {
      // Keep the last known job on a network error.
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    return subscribeToJobs(refresh);
  }, [refresh]);

  return { job, loading, refresh };
}

const REFETCH_AFTER_MILES = 0.5;
const POLL_MS = 30_000;

/** Open jobs near the porter while online. Refreshes on realtime changes and after moving. */
export function useNearbyJobs(enabled: boolean, coords: { lat: number; lng: number } | null) {
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAt = useRef<{ lat: number; lng: number } | null>(null);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const refresh = useCallback(async () => {
    const c = coordsRef.current;
    if (!enabled || !c) return;
    setLoading(true);
    try {
      setJobs(await fetchNearbyJobs(c.lat, c.lng));
      lastFetchedAt.current = c;
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Couldn't load jobs");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // First load, and again after the porter moves a meaningful distance.
  useEffect(() => {
    if (!enabled) {
      setJobs([]);
      lastFetchedAt.current = null;
      return;
    }
    if (!coords) return;
    const last = lastFetchedAt.current;
    if (!last || milesBetween(last, coords) > REFETCH_AFTER_MILES) refresh();
  }, [enabled, coords?.lat, coords?.lng, refresh]);

  // New jobs arrive over realtime. A job another porter takes stops being
  // visible to us, so realtime can't tell us it's gone: poll as well.
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribeToJobs(refresh);
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [enabled, refresh]);

  return { jobs, loading, error, refresh };
}
