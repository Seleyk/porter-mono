import { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

export default function ProofOfDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const [captured, setCaptured] = useState(false);

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
          <Text style={styles.titleText}>Proof of Delivery</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={styles.eyebrow}>Confirmation</Text>
        <Text style={styles.heading}>
          Your items have{"\n"}
          <Text style={styles.headingItalic}>arrived safely.</Text>
        </Text>

        {/* Polaroid card */}
        <View style={styles.polaroid}>
          {!captured ? (
            <Pressable style={styles.viewfinder} onPress={() => setCaptured(true)}>
              <View style={styles.viewfinderInner}>
                <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.viewfinderText}>Tap to capture photo proof</Text>
              </View>
              {/* Corner guides */}
              <View style={[styles.corner, { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 }]} />
              <View style={[styles.corner, { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 }]} />
              <View style={[styles.corner, { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
              <View style={[styles.corner, { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 }]} />
            </Pressable>
          ) : (
            <View style={styles.capturedPhoto}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.steel} />
              <Text style={styles.capturedText}>Photo captured</Text>
              <Text style={styles.capturedSub}>2:41 PM · 10 W 13th St</Text>
            </View>
          )}
          {/* Polaroid caption */}
          <View style={styles.polaroidCaption}>
            <Text style={styles.polaroidLabel}>Delivery · James R.</Text>
            <Text style={styles.polaroidDate}>May 25, 2026</Text>
          </View>
        </View>

        {/* Signature row */}
        <View style={styles.sigRow}>
          <View style={styles.sigIcon}>
            <Ionicons name="create-outline" size={16} color={Colors.steel} />
          </View>
          <Text style={styles.sigText}>Signature confirmation on file</Text>
          <Ionicons name="checkmark-circle" size={18} color={Colors.steel} />
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: captured ? pressed ? 0.85 : 1 : 0.5 }]}
          onPress={() => { if (captured) router.replace("/complete"); }}
        >
          <Text style={styles.ctaText}>Complete Delivery</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
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
    marginBottom: 24,
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
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heading: {
    fontSize: 34,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 42,
    letterSpacing: -0.3,
    marginBottom: 28,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  polaroid: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginBottom: 16,
  },
  viewfinder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  viewfinderInner: {
    alignItems: "center",
    gap: 12,
  },
  viewfinderText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: Colors.steel,
  },
  capturedPhoto: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(111,163,200,0.05)",
    gap: 10,
  },
  capturedText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  capturedSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  polaroidCaption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  polaroidLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  polaroidDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  sigRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(111,163,200,0.06)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.15)",
    padding: 14,
  },
  sigIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sigText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
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
