const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const BASE  = "https://api.mapbox.com/directions/v5/mapbox/driving";

export interface RouteResult {
  coords: [number, number][];
  distanceMiles: number;
  durationMinutes: number;
}

export async function fetchRoute(
  origin: [number, number],
  dest:   [number, number],
): Promise<RouteResult> {
  try {
    const url =
      `${BASE}/${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${TOKEN}`;
    const res  = await fetch(url);
    if (!res.ok) return { coords: [origin, dest], distanceMiles: 0, durationMinutes: 0 };
    const json = await res.json();
    const route = json.routes?.[0];
    const coords = route?.geometry?.coordinates as [number, number][] | undefined;
    return {
      coords: coords?.length ? coords : [origin, dest],
      distanceMiles: route ? route.distance / 1609.34 : 0,
      durationMinutes: route ? route.duration / 60 : 0,
    };
  } catch {
    return { coords: [origin, dest], distanceMiles: 0, durationMinutes: 0 };
  }
}
