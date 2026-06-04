import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";
import { DEMO_DRIVERS } from "@/constants/simulation";

const STEPS = ["Booked", "Dispatched", "En Route", "At Door"];
const COMPARTMENT = "B4";

export default function PorterBoxHandoffScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<"verify" | "ready">("verify");
  const {
    porterBoxCode,
    selectedBoxName,
    pickup,
    dropoff,
    assignedDriverName,
    assignedDriverInitials,
    assignedDriverRating,
    reset,
  } = useBookingStore();

  const driver = DEMO_DRIVERS.find((d) => d.initials === assignedDriverInitials);
  const driverFirstName = assignedDriverName?.split(" ")[0] ?? "Your porter";
  const codeDigits = (porterBoxCode ?? "0000").split("");
  const now = new Date();
  const timeStamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"} · ${now.getDate()} ${now.toLocaleString("default", { month: "short" }).toUpperCase()}`;

  if (phase === "ready") {
    return (
      <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow */}
          <Text style={styles.eyebrow}>SECURING YOUR ITEMS</Text>

          {/* Heading */}
          <Text style={styles.heading}>
            Your pickup code is{" "}
            <Text style={styles.headingItalic}>ready.</Text>
          </Text>
          <Text style={styles.subtext}>
            Enter this code at the locker keypad. Available anytime you're ready.
          </Text>

          {/* Polaroid card */}
          <View style={styles.polaroid}>
            <View style={styles.polaroidInner}>
              <View style={styles.polaroidLabel}>
                <Ionicons name="cube-outline" size={12} color={Colors.gold} />
                <Text style={styles.polaroidLabelText}>PORTER BOX · {COMPARTMENT}</Text>
              </View>
              {/* Luggage illustration placeholder */}
              <View style={styles.luggageWrap}>
                <View style={styles.luggageLarge}>
                  <View style={styles.luggageHandle} />
                  <View style={styles.luggageTag}>
                    <Text style={styles.luggageTagText}>PRTR</Text>
                  </View>
                </View>
                <View style={styles.luggageSmall} />
              </View>
              <Text style={styles.polaroidTime}>{timeStamp}</Text>
            </View>
            <Text style={styles.polaroidCaption}>
              Stored in <Text style={styles.polaroidCaptionBold}>Compartment {COMPARTMENT}</Text>
            </Text>
          </View>

          {/* Code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR PICKUP CODE</Text>
            <View style={styles.codeRow}>
              {codeDigits.map((d, i) => (
                <Text key={i} style={styles.codeDigit}>{d}</Text>
              ))}
            </View>
            <Text style={styles.codeSub}>Also saved under Services › Porter Box.</Text>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { reset(); router.replace("/(tabs)"); }}
          >
            <Text style={styles.ctaText}>Save code & complete</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Phase 1 — verify
  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top row */}
        <View style={styles.topBar}>
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>PHASE 1 · PICKUP</Text>
          </View>
          <Text style={styles.stepLabel}>Step 4 of 4</Text>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>AT YOUR DOOR</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>
          {driverFirstName} is at{"\n"}your door.
        </Text>
        <Text style={styles.verifyCodeHint}>
          Verification code · {codeDigits.join(" ")}
        </Text>

        {/* Step progress */}
        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepLine, i < STEPS.length - 1 && styles.stepLineFull, i === STEPS.length - 1 && styles.stepLineLast]} />
            </View>
          ))}
        </View>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>{assignedDriverInitials ?? "P"}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName}>{assignedDriverName ?? "Your Porter"}</Text>
              <Ionicons name="star" size={13} color={Colors.gold} />
              <Text style={styles.driverRating}>{assignedDriverRating?.toFixed(2) ?? "4.98"}</Text>
            </View>
            <Text style={styles.driverVehicle}>
              {driver ? `${driver.vehicle} · ${driver.plate}` : "Identity verified"}
            </Text>
          </View>
          <View style={styles.driverActions}>
            <Pressable style={styles.driverActionBtn}>
              <Ionicons name="refresh-outline" size={18} color={Colors.text} />
            </Pressable>
            <Pressable style={styles.driverActionBtn}>
              <Ionicons name="call-outline" size={18} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeDotPickup} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>{pickup || "Your location"}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.routeDotDropoff} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>DROPOFF</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                Porter Box · {selectedBoxName || "Hub"}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>VERIFICATION CODE</Text>
          <View style={styles.codeRow}>
            {codeDigits.map((d, i) => (
              <Text key={i} style={styles.codeDigit}>{d}</Text>
            ))}
          </View>
          <Text style={styles.codeSub}>Share with {driverFirstName} to authorize the handoff.</Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => setPhase("ready")}
        >
          <Text style={styles.ctaText}>Confirm pickup</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phasePill: {
    backgroundColor: "rgba(111,163,200,0.12)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  phaseText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
    letterSpacing: 1.5,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.steel,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
    letterSpacing: 2.5,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  heading: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  subtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: "center",
    marginHorizontal: 8,
  },
  verifyCodeHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: -8,
  },
  stepsRow: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 4,
  },
  stepItem: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.steel,
  },
  stepLineFull: {
    backgroundColor: Colors.steel,
  },
  stepLineLast: {
    backgroundColor: "rgba(111,163,200,0.3)",
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(20,46,80,0.7)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    padding: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.midnight,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  driverInitials: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.bgDeep,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  driverName: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  driverRating: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  driverVehicle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  driverActions: {
    flexDirection: "row",
    gap: 8,
  },
  driverActionBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  routeCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 10,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  routeDotPickup: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
    marginTop: 14,
    flexShrink: 0,
  },
  routeDotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginTop: 14,
    flexShrink: 0,
  },
  routeLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 22,
  },
  routeLabel: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 2,
  },
  routeAddr: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  codeCard: {
    backgroundColor: "rgba(10,20,35,0.85)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    padding: 22,
    alignItems: "center",
    gap: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 3,
  },
  codeRow: {
    flexDirection: "row",
    gap: 16,
  },
  codeDigit: {
    fontSize: 48,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -1,
  },
  codeSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  polaroid: {
    backgroundColor: "#F5F0E8",
    borderRadius: 4,
    padding: 12,
    paddingBottom: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 8,
  },
  polaroidInner: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 2,
    padding: 14,
    gap: 8,
  },
  polaroidLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  polaroidLabelText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 2,
  },
  luggageWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingVertical: 24,
    justifyContent: "center",
  },
  luggageLarge: {
    width: 80,
    height: 100,
    backgroundColor: "#2A2A40",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  luggageHandle: {
    width: 30,
    height: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderBottomWidth: 0,
  },
  luggageTag: {
    position: "absolute",
    bottom: 16,
    right: 10,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  luggageTagText: {
    fontSize: 7,
    fontFamily: Fonts.bold,
    color: "#000",
    letterSpacing: 0.5,
  },
  luggageSmall: {
    width: 60,
    height: 72,
    backgroundColor: "#2E3A50",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  polaroidTime: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  polaroidCaption: {
    fontSize: 13,
    fontFamily: Fonts.serifItalic,
    color: "#3A3020",
    letterSpacing: 0.2,
  },
  polaroidCaptionBold: {
    fontFamily: Fonts.serif,
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
    marginTop: 4,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
