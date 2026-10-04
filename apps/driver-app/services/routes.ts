import { fetchRoute as fetchMapboxRoute, type RouteResult } from "@porter/shared";

export function fetchRoute(origin: [number, number], dest: [number, number]): Promise<RouteResult> {
  return fetchMapboxRoute(origin, dest, process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");
}
