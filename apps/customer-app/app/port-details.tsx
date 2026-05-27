import { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";

type SizeKey = "large" | "standard" | "small";

const SIZES: { id: SizeKey; label: string; desc: string }[] = [
  { id: "large", label: "Large", desc: "Suitcase, trunk, oversized" },
  { id: "standard", label: "Standard", desc: "Carry-on, medium bag" },
  { id: "small", label: "Small", desc: "Tote, clutch, parcel" },
];

export default function PortDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { itemCounts, specialRequests, itemValueUSD, setItemCounts, setSpecialRequests, setItemValueUSD } = useBookingStore();
  const [counts, setCounts] = useState({ large: itemCounts.large, standard: itemCounts.standard, small: itemCounts.small });
  const [notes, setNotes] = useState(specialRequests);
  const [itemValue, setItemValue] = useState(itemValueUSD ? itemValueUSD.toString() : "");

  const parsedValue = parseFloat(itemValue);
  const valueValid = !isNaN(parsedValue) && parsedValue >= 50;

  const adjust = (id: SizeKey, delta: number) => {
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

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
            <Text style={styles.stepLabel}>2 of 4</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Heading */}
            <Text style={styles.eyebrow}>Item Details</Text>
            <Text style={styles.heading}>
              How many items{"\n"}
              <Text style={styles.headingItalic}>are we handling?</Text>
            </Text>

            {/* Stepper cards */}
            <View style={styles.cards}>
              {SIZES.map((s) => (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardLabel}>{s.label}</Text>
                    <Text style={styles.cardDesc}>{s.desc}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => adjust(s.id, -1)}
                    >
                      <Ionicons name="remove" size={18} color={counts[s.id] > 0 ? Colors.text : Colors.textDim} />
                    </Pressable>
                    <Text style={styles.stepCount}>{counts[s.id] ?? 0}</Text>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, { opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => adjust(s.id, 1)}
                    >
                      <Ionicons name="add" size={18} color={Colors.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Total summary */}
            {total > 0 && (
              <View style={styles.totalRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.steel} />
                <Text style={styles.totalText}>
                  {total} item{total !== 1 ? "s" : ""} selected
                </Text>
              </View>
            )}

            {/* Declared item value */}
            <Text style={styles.notesLabel}>Declared Item Value</Text>
            <View style={styles.valueRow}>
              <Text style={styles.valuePrefix}>$</Text>
              <TextInput
                style={styles.valueField}
                placeholder="Minimum $50"
                placeholderTextColor={Colors.textDim}
                value={itemValue}
                onChangeText={setItemValue}
                keyboardType="decimal-pad"
                selectionColor={Colors.steel}
              />
            </View>

            {/* Special requests */}
            <Text style={styles.notesLabel}>Special Requests</Text>
            <TextInput
              style={styles.notes}
              placeholder="Fragile items, oversized dimensions, instructions for your porter…"
              placeholderTextColor={Colors.textDim}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              selectionColor={Colors.steel}
              textAlignVertical="top"
            />
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: (total > 0 && valueValid) ? pressed ? 0.85 : 1 : 0.4 }]}
            onPress={() => {
              if (total > 0 && valueValid) {
                setItemCounts(counts);
                setSpecialRequests(notes);
                setItemValueUSD(parsedValue);
                router.push("/dropoff-method");
              }
            }}
          >
            <Text style={styles.ctaText}>Continue</Text>
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
    marginBottom: 28,
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
  stepLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
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
  cards: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    padding: 16,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCount: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    minWidth: 22,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  totalText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.steel,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 4,
  },
  valuePrefix: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  valueField: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  notes: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 24,
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
    marginTop: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
