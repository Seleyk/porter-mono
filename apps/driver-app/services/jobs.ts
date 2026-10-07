import { supabase } from "@/lib/supabase";
import { callFunction, type ServiceRequest } from "@porter/shared";

// Every change to a job goes through the database functions in
// supabase/migrations/20261004180200_job_functions.sql (completion goes
// through the complete-job edge function, which also takes payment). The app
// never updates service_requests directly.

export const ACTIVE_STATUSES = ["accepted", "picked_up"] as const;

export async function fetchNearbyJobs(lat: number, lng: number, radiusKm = 15): Promise<ServiceRequest[]> {
  const { data, error } = await supabase.rpc("nearby_open_requests", { lat, lng, radius_km: radiusKm });
  if (error) throw error;
  return data ?? [];
}

export async function fetchJob(id: string): Promise<ServiceRequest | null> {
  const { data, error } = await supabase.from("service_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** The job this porter is working on right now, if any. */
export async function fetchActiveJob(porterId: string): Promise<ServiceRequest | null> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("porter_id", porterId)
    .in("status", [...ACTIVE_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchJobHistory(porterId: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("porter_id", porterId)
    .in("status", ["completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function acceptJob(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc("accept_request", { request_id: id });
  if (error) throw error;
  return data;
}

export async function releaseJob(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc("release_request", { request_id: id });
  if (error) throw error;
  return data;
}

export async function markPickedUp(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc("advance_request", { request_id: id, to_status: "picked_up" });
  if (error) throw error;
  return data;
}

/**
 * Completes the job with its proof photo. The edge function also charges the
 * customer's card hold (supabase/functions/complete-job).
 */
export async function markDelivered(id: string, photoPath: string): Promise<ServiceRequest> {
  const { job } = await callFunction<{ job: ServiceRequest }>(supabase, "complete-job", { jobId: id, photoPath });
  return job;
}

/** Uploads a proof-of-delivery photo to `<job id>/<timestamp>.jpg` and returns its path. */
export async function uploadProofPhoto(jobId: string, uri: string, mimeType = "image/jpeg"): Promise<string> {
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/heic" ? "heic" : "jpg";
  const path = `${jobId}/${Date.now()}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from("proof-of-delivery")
    .upload(path, body, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return path;
}

/** Calls onChange whenever a job this porter can see is created or changes. */
export function subscribeToJobs(onChange: () => void): () => void {
  const channel = supabase
    .channel(`jobs-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
