import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";

export type Coords = { lat: number; lng: number; heading: number | null };

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function currentPosition(): Promise<Coords> {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading };
}

/** Watches the device position while the app is open. Call the returned function to stop. */
export async function watchPosition(onPosition: (c: Coords) => void): Promise<() => void> {
  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 25 },
    (pos) => onPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading }),
  );
  return () => sub.remove();
}

/** Publishes this porter's position. Customers can only read it while the porter is on their job. */
export async function publishLocation(porterId: string, c: Coords, isOnline: boolean): Promise<void> {
  const { error } = await supabase.from("porter_locations").upsert(
    {
      porter_id: porterId,
      latitude: c.lat,
      longitude: c.lng,
      heading: c.heading,
      is_online: isOnline,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "porter_id" },
  );
  if (error) throw error;
}

export async function setOffline(porterId: string): Promise<void> {
  await supabase.from("porter_locations").update({ is_online: false }).eq("porter_id", porterId);
}
