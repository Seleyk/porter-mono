const BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export interface MapboxFeature {
  id: string;
  place_name: string;       // full formatted address
  text: string;             // short place name
  center: [number, number]; // [lng, lat] — Mapbox is longitude-first
}

export async function searchPlaces(query: string): Promise<MapboxFeature[]> {
  if (query.trim().length < 2) return [];
  const url =
    `${BASE}/${encodeURIComponent(query.trim())}.json` +
    `?access_token=${TOKEN}` +
    `&types=address,poi,neighborhood,place` +
    `&country=US` +
    `&limit=5` +
    `&autocomplete=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.features ?? []) as MapboxFeature[];
  } catch {
    return [];
  }
}
