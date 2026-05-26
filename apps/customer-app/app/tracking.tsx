import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

const STAGES = [
  { id: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" as const },
  { id: "enroute", label: "En Route", icon: "navigate-outline" as const },
  { id: "arrived", label: "Arrived", icon: "location-outline" as const },
  { id: "transit", label: "In Transit", icon: "car-outline" as const },
  { id: "delivered", label: "Delivered", icon: "home-outline" as const },
];

const STOPS = [
  { label: "240 Park Hill Ave", sub: "Pickup · Arrived 2:14 PM", done: true },
  { label: "10 W 13th St", sub: "Drop-off · ETA 2:41 PM", done: false },
];

const PORTERS = [
  { initials: "JR", x: "22%", y: "48%" },
  { initials: "MA", x: "65%", y: "22%" },
  { initials: "EH", x: "12%", y: "64%" },
];

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const [stageIdx, setStageIdx] = useState(1);

  const stage = STAGES[stageIdx];

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
          <Text style={styles.titleText}>Live Tracking</Text>
          <Pressable style={styles.helpBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
          {/* Mini map */}
          <View style={styles.mapCard}>
            {[25, 50, 75].map((p) => (
              <View key={`h${p}`} style={[styles.gridLine, { top: `${p}%` as any, left: 0, right: 0, height: 1 }]} />
            ))}
            {[20, 40, 60, 80].map((p) => (
              <View key={`v${p}`} style={[styles.gridLine, { left: `${p}%` as any, top: 0, bottom: 0, width: 1 }]} />
            ))}
            {PORTERS.map((p) => (
              <View key={p.initials} style={[styles.porterBadge, { left: p.x as any, top: p.y as any, transform: [{ translateX: -14 }, { translateY: -14 }] }]}>
                <Text style={styles.porterInitials}>{p.initials}</Text>
              </View>
            ))}
            <View style={[styles.activePorter, { left: "49%" as any, top: "38%" as any, transform: [{ translateX: -18 }, { translateY: -18 }] }]}>
              <Text style={styles.activePorterText}>JR</Text>
            </View>
            <View style={[styles.userDot, { left: "49%" as any, top: "62%" as any, transform: [{ translateX: -10 }, { translateY: -10 }] }]} />
          </View>

          {/* Stage progress bar */}
          <View style={styles.stageBar}>
            {STAGES.map((s, i) => (
              <View key={s.id} style={styles.stageItem}>
                <View style={[styles.stageCircle, i <= stageIdx && styles.stageCircleActive]}>
                  <Ionicons name={s.icon} size={13} color={i <= stageIdx ? "#fff" : Colors.textDim} />
                </View>
                <Text style={[styles.stageLabel, i <= stageIdx && styles.stageLabelActive]}>{s.label}</Text>
                {i < STAGES.length - 1 && (
                  <View style={[styles.stageLine, i < stageIdx && styles.stageLineActive]} />
                )}
              </View>
            ))}
          </View>

          {/* Status card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIconWrap}>
                <Ionicons name={stage.icon} size={20} color={Colors.steel} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>{stage.label}</Text>
                <Text style={styles.statusEta}>Estimated arrival in <Text style={styles.statusEtaNum}>27 min</Text></Text>
              </View>
              <Pressable onPress={() => setStageIdx(Math.min(STAGES.length - 1, stageIdx + 1))} style={styles.advanceBtn}>
                <Text style={styles.advanceBtnText}>Next</Text>
              </Pressable>
            </View>
          </View>

          {/* Porter card */}
          <View style={styles.porterCard}>
            <View style={styles.porterAvatar}>
              <Text style={styles.porterAvatarText}>JR</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.porterName}>James R.</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={Colors.gold} />
                <Text style={styles.ratingText}>4.98 · 2,341 deliveries</Text>
              </View>
            </View>
            <View style={styles.porterActions}>
              <Pressable style={styles.porterActionBtn}>
                <Ionicons name="call-outline" size={18} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.porterActionBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Route stops */}
          <View style={styles.routeCard}>
            <Text style={styles.routeLabel}>ROUTE</Text>
            {STOPS.map((s, i) => (
              <View key={s.label} style={styles.stopRow}>
                <View style={styles.stopDotCol}>
                  <View style={[styles.stopDot, s.done && styles.stopDotDone]} />
                  {i < STOPS.length - 1 && <View style={styles.stopLine} />}
                </View>
                <View style={styles.stopBody}>
                  <Text style={[styles.stopLabel, s.done && styles.stopLabelDone]}>{s.label}</Text>
                  <Text style={styles.stopSub}>{s.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Complete CTA (dev shortcut) */}
        {stageIdx === STAGES.length - 1 && (
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1, marginTop: 12 }]}
            onPress={() => router.push("/proof-of-delivery")}
          >
            <Text style={styles.ctaText}>View Delivery Confirmation</Text>
          </Pressable>
        )}
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
    marginBottom: 16,
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
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  helpBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCard: {
    height: 180,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  porterBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.navy,
    borderWidth: 1,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  porterInitials: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  activePorter: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.midnight,
    borderWidth: 2,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  activePorterText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  userDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
    borderWidth: 3,
    borderColor: "rgba(229,201,122,0.3)",
  },
  stageBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  stageItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  stageCircleActive: {
    backgroundColor: Colors.midnight,
    borderColor: Colors.steel,
  },
  stageLabel: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  stageLabelActive: {
    color: Colors.steel,
  },
  stageLine: {
    position: "absolute",
    top: 14,
    left: "60%",
    right: "-60%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  stageLineActive: {
    backgroundColor: Colors.steel,
  },
  statusCard: {
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    padding: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    marginBottom: 2,
  },
  statusEta: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  statusEtaNum: {
    fontFamily: Fonts.semibold,
    color: Colors.steel,
  },
  advanceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
  },
  advanceBtnText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.steel,
  },
  porterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  porterAvatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.midnight,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  porterAvatarText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  porterName: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  porterActions: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  porterActionBtn: {
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
    padding: 18,
    gap: 0,
  },
  routeLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  stopRow: {
    flexDirection: "row",
    gap: 12,
  },
  stopDotCol: {
    alignItems: "center",
    width: 20,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 2,
  },
  stopDotDone: {
    backgroundColor: Colors.steel,
    borderColor: Colors.steel,
  },
  stopLine: {
    width: 1,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
    minHeight: 20,
  },
  stopBody: {
    flex: 1,
    paddingBottom: 16,
    gap: 3,
  },
  stopLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  stopLabelDone: {
    color: Colors.text,
  },
  stopSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
