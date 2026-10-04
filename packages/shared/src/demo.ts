export type DemoDriver = {
  id: string;
  initials: string;
  name: string;
  rating: number;
  coords: { lng: number; lat: number };
  available: boolean;
  vehicle: string;
  plate: string;
};

export const DEMO_USER_COORDS = { lng: -80.1340, lat: 25.7823 }; // South Beach, Miami

export const DEMO_DRIVERS: DemoDriver[] = [
  { id: "d1", initials: "JR", name: "James R.", rating: 4.98, coords: { lng: -80.1301, lat: 25.7798 }, available: true, vehicle: "Black Tesla Model Y", plate: "SBE 112" },
  { id: "d2", initials: "MA", name: "Marcus A.", rating: 4.95, coords: { lng: -80.1362, lat: 25.7752 }, available: true, vehicle: "Red Toyota RAV4", plate: "MLX 004" },
  { id: "d3", initials: "EH", name: "Elena H.", rating: 4.99, coords: { lng: -80.1298, lat: 25.7880 }, available: true, vehicle: "White Mercedes GLC", plate: "MIA 337" },
  { id: "d4", initials: "TK", name: "Theo K.", rating: 4.96, coords: { lng: -80.1290, lat: 25.7760 }, available: true, vehicle: "Silver BMW X5", plate: "FLA 891" },
  { id: "d5", initials: "LO", name: "Lena O.", rating: 4.97, coords: { lng: -80.1944, lat: 25.7657 }, available: false, vehicle: "Gray Honda CR-V", plate: "BKL 509" },
];

export const DEMO_HUBS = [
  { id: "demo-hub-1", name: "Brickell City Centre", address: "701 S Miami Ave, Miami, FL", capacity: 8, is_active: true },
  { id: "demo-hub-2", name: "Design District", address: "140 NE 39th St, Miami, FL", capacity: 6, is_active: true },
  { id: "demo-hub-3", name: "South Beach Terminal", address: "500 Ocean Dr, Miami Beach, FL", capacity: 10, is_active: true },
  { id: "demo-hub-4", name: "Coconut Grove Station", address: "3015 Grand Ave, Miami, FL", capacity: 8, is_active: true },
];

function distanceKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export const DEMO_CURRENT_LOCATION = {
  label: "South Beach, Miami",
  coords: DEMO_USER_COORDS,
};

export const DEMO_FAVORITES = [
  { icon: "home-outline", label: "1 Hotel South Beach", sub: "Home · 2341 Collins Ave", iconColor: "#6FA3C8", coords: { lng: -80.1292, lat: 25.7911 } },
  { icon: "briefcase-outline", label: "Brickell City Centre", sub: "Work · 701 S Miami Ave", iconColor: "#6FA3C8", coords: { lng: -80.1944, lat: 25.7657 } },
  { icon: "star", label: "Faena Hotel Miami Beach", sub: "Favorite · 3201 Collins Ave", iconColor: "#D4A843", coords: { lng: -80.1221, lat: 25.8150 } },
];

export const DEMO_RECENTS = [
  { label: "Pérez Art Museum Miami", sub: "1103 Biscayne Blvd · 10 min ago", coords: { lng: -80.1859, lat: 25.7804 } },
  { label: "Wynwood Walls", sub: "2520 NW 2nd Ave · 4 days ago", coords: { lng: -80.1993, lat: 25.8006 } },
  { label: "Design District", sub: "NE 38th St, Miami · last week", coords: { lng: -80.1948, lat: 25.8095 } },
];

export function closestAvailableDriver(userCoords: { lng: number; lat: number }): DemoDriver {
  const available = DEMO_DRIVERS.filter((d) => d.available);
  return available.sort(
    (a, b) => distanceKm(userCoords, a.coords) - distanceKm(userCoords, b.coords)
  )[0];
}
