// Map defaults shared by the customer and driver apps. Launch city: Miami.

/** [lng, lat] as Mapbox expects. South Beach, matching the demo user location. */
export const MIAMI_CENTER: [number, number] = [-80.134, 25.7823];

export const DEFAULT_ZOOM = 14.5;

export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/navigation-day-v1",
} as const;

export function mapStyleFor(isDark: boolean): string {
  return isDark ? MAP_STYLES.dark : MAP_STYLES.light;
}
