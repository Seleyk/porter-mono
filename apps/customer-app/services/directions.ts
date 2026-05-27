const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const BASE  = "https://api.mapbox.com/directions/v5/mapbox/driving";

export async function fetchRoute(
  origin: [number, number],
  dest:   [number, number],
): Promise<[number, number][]> {
  try {
    const url =
      `${BASE}/${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
      `?geometries=geojson&overview=full&steps=false&access_token=${TOKEN}`;
    const res  = await fetch(url);
    if (!res.ok) return [origin, dest];
    const json = await res.json();
    const coords = json.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    return coords?.length ? coords : [origin, dest];
  } catch {
    return [origin, dest];
  }
}
