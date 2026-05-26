import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

const LOCATIONS = [
  { id: "madison", name: "Porter Box · Madison", dist: "0.2 mi", address: "150 E 42nd St", slots: 4 },
  { id: "lexington", name: "Porter Box · Lexington", dist: "0.5 mi", address: "580 Lexington Ave", slots: 7 },
  { id: "fifth", name: "Porter Box · Fifth Ave", dist: "0.8 mi", address: "611 Fifth Ave", slots: 2 },
];

const HOW_TO = [
  { step: "1", text: "Select a nearby Porter Box location." },
  { step: "2", text: "A porter delivers your items and locks them in." },
  { step: "3", text: "You receive a unique pickup code via SMS." },
  { step: "4", text: "Retrieve your items at any time — no rush." },
];

export default function PorterBoxHubScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"pickup" | "dropoff">("pickup");

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>
          <Text style={styles.titleText}>Porter Box</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Segmented control */}
        <View style={styles.segmented}>
          <Pressable
            style={[styles.segBtn, tab === "pickup" && styles.segBtnActive]}
            onPress={() => setTab("pickup")}
          >
            <Text style={[styles.segText, tab === "pickup" && styles.segTextActive]}>Pick Up</Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, tab === "dropoff" && styles.segBtnActive]}
            onPress={() => setTab("dropoff")}
          >
            <Text style={[styles.segText, tab === "dropoff" && styles.segTextActive]}>Drop Off</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
          {tab === "pickup" ? (
            <>
              {/* Active pickup */}
              <View style={styles.activeCard}>
                <View style={styles.activeCardHeader}>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>Ready for pickup</Text>
                  </View>
                  <Text style={styles.activeTimer}>2h 14m stored</Text>
                </View>
                <Text style={styles.activeTitle}>Your items are waiting</Text>
                <Text style={styles.activeSub}>Porter Box · Madison · 150 E 42nd St</Text>
                <Pressable
                  style={({ pressed }) => [styles.pickupBtn, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push("/porter-box-pickup")}
                >
                  <Text style={styles.pickupBtnText}>Get Pickup Code</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </Pressable>
              </View>

              {/* How to collect */}
              <Text style={styles.sectionLabel}>HOW TO COLLECT</Text>
              {HOW_TO.map((h) => (
                <View key={h.step} style={styles.howRow}>
                  <View style={styles.howNum}>
                    <Text style={styles.howNumText}>{h.step}</Text>
                  </View>
                  <Text style={styles.howText}>{h.text}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.eyebrow}>Nearby Locations</Text>
              {LOCATIONS.map((loc) => (
                <Pressable
                  key={loc.id}
                  style={({ pressed }) => [styles.locationCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push("/where-to")}
                >
                  <View style={styles.locationIconWrap}>
                    <Ionicons name="cube-outline" size={22} color={Colors.gold} />
                  </View>
                  <View style={styles.locationBody}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    <Text style={styles.locationAddr}>{loc.address}</Text>
                    <View style={styles.locationMeta}>
                      <Ionicons name="location-outline" size={12} color={Colors.textDim} />
                      <Text style={styles.locationMetaText}>{loc.dist}</Text>
                      <Text style={styles.locationMetaDot}>·</Text>
                      <Text style={styles.locationMetaText}>{loc.slots} slots open</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      </View>
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
  titleText: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 4,
    marginBottom: 20,
  },
  segBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: {
    backgroundColor: Colors.midnight,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
  },
  segText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  segTextActive: {
    color: Colors.text,
  },
  activeCard: {
    backgroundColor: "rgba(229,201,122,0.06)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.25)",
    padding: 20,
    gap: 8,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(229,201,122,0.12)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
  },
  activePillText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  activeTimer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  activeTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -0.2,
  },
  activeSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  pickupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    marginTop: 4,
  },
  pickupBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  howNum: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  howNumText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
  },
  howText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.15)",
    padding: 16,
  },
  locationIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: "rgba(229,201,122,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locationBody: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  locationAddr: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  locationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationMetaText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  locationMetaDot: {
    fontSize: 11,
    color: Colors.textDim,
  },
});
