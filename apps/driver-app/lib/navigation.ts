import { Linking, Platform } from "react-native";

/** Opens turn-by-turn directions in the phone's maps app. */
export function openDirections(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${q}`
      : `google.navigation:q=${lat},${lng}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`),
  );
}

export function callPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
}
