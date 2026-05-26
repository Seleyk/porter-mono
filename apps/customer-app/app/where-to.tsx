import { useState, useRef } from "react";
import {
  StyleSheet, Text, View, Pressable, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";

const FAVORITES = [
  { icon: "home-outline" as const, label: "240 Park Hill Ave", sub: "Home · New York, NY" },
  { icon: "briefcase-outline" as const, label: "10 W 13th St", sub: "Work · New York, NY" },
  { icon: "star-outline" as const, label: "The Carlyle", sub: "Favorite · 35 E 76th St" },
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
  const dropoffRef = useRef<TextInput>(null);

  const canContinue = localPickup.trim().length > 0 && localDropoff.trim().length > 0;

  const selectDestination = (label: string) => {
    if (!localPickup) {
      setLocalPickup(label);
      dropoffRef.current?.focus();
    } else {
      setLocalDropoff(label);
    }
  };

  const handleConfirm = () => {
    if (!canContinue) return;
    setRoute(localPickup.trim(), localDropoff.trim());
    router.push("/select-type");
  };

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
            {/* Pickup */}
            <View style={styles.routeRow}>
              <View style={styles.dotWrap}>
                <View style={styles.dotPickup} />
              </View>
              <TextInput
                style={styles.routeInput}
                placeholder="Pickup location"
                placeholderTextColor={Colors.textDim}
                value={localPickup}
                onChangeText={setLocalPickup}
                selectionColor={Colors.steel}
                returnKeyType="next"
                onSubmitEditing={() => dropoffRef.current?.focus()}
              />
              {localPickup.length > 0 && (
                <Pressable onPress={() => setLocalPickup("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={Colors.textDim} />
                </Pressable>
              )}
            </View>

            {/* Connector line */}
            <View style={styles.connectorRow}>
              <View style={styles.connectorDot} />
              <View style={styles.connectorLine} />
              <View style={styles.connectorDot} />
            </View>

            {/* Dropoff */}
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
                onChangeText={setLocalDropoff}
                selectionColor={Colors.steel}
                returnKeyType="done"
              />
              {localDropoff.length > 0 && (
                <Pressable onPress={() => setLocalDropoff("")} hitSlop={8}>
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

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Favorites */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FAVORITES</Text>
              {FAVORITES.map((f) => (
                <Pressable
                  key={f.label}
                  style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => selectDestination(f.label)}
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

            {/* Recents */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENT</Text>
              {RECENTS.map((r) => (
                <Pressable
                  key={r.label}
                  style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => selectDestination(r.label)}
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
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: canContinue ? pressed ? 0.85 : 1 : 0.4 }]}
            onPress={handleConfirm}
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
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 12,
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
