import { useState, useRef, useCallback } from "react";
import {
  StyleSheet, Text, View, Pressable, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore, type LatLng } from "@/store/bookingStore";
import { searchPlaces, type MapboxFeature } from "@/services/geocoding";

const FAVORITES = [
  { icon: "home-outline" as const, label: "240 Park Hill Ave", sub: "Home · New York, NY" },
  { icon: "briefcase-outline" as const, label: "10 W 13th St", sub: "Work · New York, NY" },
  { icon: "star-outline" as const, label: "The Carlyle Hotel", sub: "Favorite · 35 E 76th St" },
];

const RECENTS = [
  { label: "Saks Fifth Avenue", sub: "611 Fifth Ave" },
  { label: "The Museum of Modern Art", sub: "11 W 53rd St" },
  { label: "553 W 161st St", sub: "New York, NY" },
];

export default function WhereToScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, dropoff, setRoute } = useBookingStore();
  const [localPickup, setLocalPickup] = useState(pickup);
  const [localDropoff, setLocalDropoff] = useState(dropoff);
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "dropoff" | null>(null);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffRef = useRef<TextInput>(null);

  const canContinue =
    localPickup.trim().length > 0 && localDropoff.trim().length > 0 &&
    pickupCoords !== null && dropoffCoords !== null;

  const handleTextChange = useCallback((text: string, field: "pickup" | "dropoff") => {
    if (field === "pickup") { setLocalPickup(text); setPickupCoords(null); }
    else { setLocalDropoff(text); setDropoffCoords(null); }
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlaces(text);
      setSuggestions(results);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleSelectSuggestion = (f: MapboxFeature) => {
    const coords: LatLng = { lat: f.center[1], lng: f.center[0] };
    const fillPickup = activeField === "pickup" || localPickup.trim().length === 0;
    if (fillPickup) {
      setLocalPickup(f.place_name); setPickupCoords(coords);
      setSuggestions([]); dropoffRef.current?.focus(); setActiveField("dropoff");
    } else {
      setLocalDropoff(f.place_name); setDropoffCoords(coords);
      setSuggestions([]); setActiveField(null);
    }
  };

  // Tap a static favorite/recent — immediately geocodes and sets coords in one step
  const handleSelectFavorite = useCallback(async (label: string) => {
    const targetField: "pickup" | "dropoff" = localPickup.trim().length === 0 ? "pickup" : "dropoff";
    if (targetField === "pickup") { setLocalPickup(label); setPickupCoords(null); setActiveField("pickup"); }
    else { setLocalDropoff(label); setDropoffCoords(null); setActiveField("dropoff"); }
    setSuggestions([]);

    setIsSearching(true);
    const results = await searchPlaces(label);
    setIsSearching(false);

    if (results.length > 0) {
      const f = results[0];
      const coords: LatLng = { lat: f.center[1], lng: f.center[0] };
      if (targetField === "pickup") {
        setLocalPickup(f.place_name); setPickupCoords(coords);
        dropoffRef.current?.focus(); setActiveField("dropoff");
      } else {
        setLocalDropoff(f.place_name); setDropoffCoords(coords);
        setActiveField(null);
      }
    }
  }, [localPickup]);

  const handleConfirm = () => {
    if (!canContinue) return;
    setRoute(localPickup.trim(), localDropoff.trim(), pickupCoords, dropoffCoords);
    router.push("/select-type");
  };

  const showSuggestions = suggestions.length > 0 || isSearching;

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.text} />
            </Pressable>
            <Text style={styles.title}>Where To?</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Pickup / Dropoff card */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.dotWrap}>
                <View style={styles.dotPickup} />
              </View>
              <TextInput
                style={styles.routeInput}
                placeholder="Pickup location"
                placeholderTextColor={Colors.textDim}
                value={localPickup}
                onFocus={() => setActiveField("pickup")}
                onChangeText={(t) => handleTextChange(t, "pickup")}
                selectionColor={Colors.steel}
                returnKeyType="next"
                onSubmitEditing={() => dropoffRef.current?.focus()}
              />
              {localPickup.length > 0 && (
                <Pressable onPress={() => { setLocalPickup(""); setPickupCoords(null); setSuggestions([]); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={Colors.textDim} />
                </Pressable>
              )}
            </View>

            <View style={styles.connectorRow}>
              <View style={styles.connectorDot} />
              <View style={styles.connectorLine} />
              <View style={styles.connectorDot} />
            </View>

            <View style={styles.routeRow}>
              <View style={styles.dotWrap}>
                <View style={styles.dotDropoff} />
              </View>
              <TextInput
                ref={dropoffRef}
                style={styles.routeInput}
                placeholder="Drop-off location"
                placeholderTextColor={Colors.textDim}
                value={localDropoff}
                onFocus={() => setActiveField("dropoff")}
                onChangeText={(t) => handleTextChange(t, "dropoff")}
                selectionColor={Colors.steel}
                returnKeyType="done"
              />
              {localDropoff.length > 0 && (
                <Pressable onPress={() => { setLocalDropoff(""); setDropoffCoords(null); setSuggestions([]); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={Colors.textDim} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Chips */}
          <View style={styles.chips}>
            <Pressable style={styles.chip}>
              <Ionicons name="map-outline" size={14} color={Colors.steel} />
              <Text style={styles.chipText}>Set on map</Text>
            </Pressable>
            <Pressable style={styles.chip}>
              <Ionicons name="calendar-outline" size={14} color={Colors.steel} />
              <Text style={styles.chipText}>Schedule</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {showSuggestions ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>{isSearching ? "SEARCHING…" : "SUGGESTIONS"}</Text>
                  {isSearching && <ActivityIndicator size="small" color={Colors.steel} />}
                </View>
                {suggestions.map((f) => (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => handleSelectSuggestion(f)}
                  >
                    <View style={styles.listIconBox}>
                      <Ionicons name="location-outline" size={16} color={Colors.steel} />
                    </View>
                    <View style={styles.listText}>
                      <Text style={styles.listTitle} numberOfLines={1}>{f.text}</Text>
                      <Text style={styles.listSub} numberOfLines={1}>{f.place_name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>FAVORITES</Text>
                  {FAVORITES.map((f) => (
                    <Pressable
                      key={f.label}
                      style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => handleSelectFavorite(f.label)}
                    >
                      <View style={styles.listIconBox}>
                        <Ionicons name={f.icon} size={16} color={Colors.steel} />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>{f.label}</Text>
                        <Text style={styles.listSub}>{f.sub}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>RECENT</Text>
                  {RECENTS.map((r) => (
                    <Pressable
                      key={r.label}
                      style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => handleSelectFavorite(r.label)}
                    >
                      <View style={styles.listIconBox}>
                        <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>{r.label}</Text>
                        <Text style={styles.listSub}>{r.sub}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: canContinue ? (pressed ? 0.85 : 1) : 0.4 }]}
            onPress={handleConfirm}
            disabled={!canContinue}
          >
            <Text style={styles.ctaText}>Confirm Route</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  routeCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  dotWrap: {
    width: 20,
    alignItems: "center",
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
  },
  dotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  routeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  connectorRow: {
    flexDirection: "column",
    alignItems: "center",
    paddingLeft: 25,
    height: 14,
    gap: 2,
  },
  connectorDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  connectorLine: {
    flex: 1,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chips: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(111,163,200,0.08)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.steel,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  listIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  listSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
    marginTop: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
