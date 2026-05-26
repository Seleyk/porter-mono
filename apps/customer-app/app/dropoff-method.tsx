import { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore, type DropoffMethod } from "@/store/bookingStore";

const BOXES = [
  { id: "box1", name: "Porter Box · Madison", dist: "0.2 mi", slots: 4 },
  { id: "box2", name: "Porter Box · Lexington", dist: "0.5 mi", slots: 7 },
  { id: "box3", name: "Porter Box · Fifth Ave", dist: "0.8 mi", slots: 2 },
];

export default function DropoffMethodScreen() {
  const insets = useSafeAreaInsets();
  const { dropoffMethod, selectedBoxId, setDropoffMethod, setSelectedBox } = useBookingStore();
  const [method, setMethod] = useState<DropoffMethod>(dropoffMethod);
  const [selectedBox, setLocalBox] = useState<string | null>(selectedBoxId);

  const canContinue = method === "door" || (method === "box" && selectedBox !== null);

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
          <Text style={styles.stepLabel}>3 of 4</Text>
        </View>

        {/* Heading */}
        <Text style={styles.eyebrow}>Drop-off Method</Text>
        <Text style={styles.heading}>
          Where shall we{"\n"}
          <Text style={styles.headingItalic}>leave your items?</Text>
        </Text>

        {/* Method cards */}
        <View style={styles.methods}>
          <Pressable
            style={[styles.methodCard, method === "door" && styles.methodCardActive]}
            onPress={() => setMethod("door")}
          >
            <View style={[styles.methodIcon, method === "door" && styles.methodIconActive]}>
              <Ionicons name="home-outline" size={24} color={method === "door" ? Colors.steel : Colors.textMuted} />
            </View>
            <View style={styles.methodBody}>
              <Text style={[styles.methodLabel, method === "door" && styles.methodLabelActive]}>Door Handoff</Text>
              <Text style={styles.methodDesc}>Porter delivers directly to your door, signature confirmed.</Text>
            </View>
            <View style={[styles.radio, method === "door" && styles.radioActive]}>
              {method === "door" && <View style={styles.radioDot} />}
            </View>
          </Pressable>

          <Pressable
            style={[styles.methodCard, method === "box" && styles.methodCardActive]}
            onPress={() => setMethod("box")}
          >
            <View style={[styles.methodIcon, method === "box" && styles.methodIconActive]}>
              <Ionicons name="cube-outline" size={24} color={method === "box" ? Colors.gold : Colors.textMuted} />
            </View>
            <View style={styles.methodBody}>
              <Text style={[styles.methodLabel, method === "box" && styles.methodLabelActive]}>Porter Box</Text>
              <Text style={styles.methodDesc}>Secured in a climate-controlled locker. Retrieve at your convenience.</Text>
            </View>
            <View style={[styles.radio, method === "box" && styles.radioActiveGold]}>
              {method === "box" && <View style={styles.radioDotGold} />}
            </View>
          </Pressable>
        </View>

        {/* Box picker (shown when Porter Box selected) */}
        {method === "box" && (
          <View style={styles.boxPicker}>
            <Text style={styles.boxPickerLabel}>NEARBY LOCATIONS</Text>
            {BOXES.map((b) => (
              <Pressable
                key={b.id}
                style={[styles.boxRow, selectedBox === b.id && styles.boxRowActive]}
                onPress={() => { setLocalBox(b.id); }}
              >
                <View style={styles.boxInfo}>
                  <Text style={styles.boxName}>{b.name}</Text>
                  <Text style={styles.boxMeta}>{b.dist} · {b.slots} slots available</Text>
                </View>
                <View style={[styles.radio, selectedBox === b.id && styles.radioActiveGold]}>
                  {selectedBox === b.id && <View style={styles.radioDotGold} />}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: canContinue ? pressed ? 0.85 : 1 : 0.4 }]}
          onPress={() => {
              if (!canContinue) return;
              setDropoffMethod(method);
              if (method === "box" && selectedBox) {
                const box = BOXES.find((b) => b.id === selectedBox);
                setSelectedBox(selectedBox, box?.name ?? selectedBox);
              }
              router.push("/delivery-method");
            }}
        >
          <Text style={styles.ctaText}>Continue</Text>
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
  methods: {
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
  },
  methodCardActive: {
    backgroundColor: "rgba(111,163,200,0.08)",
    borderColor: "rgba(111,163,200,0.35)",
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  methodIconActive: {
    backgroundColor: "rgba(111,163,200,0.1)",
    borderColor: "rgba(111,163,200,0.2)",
  },
  methodBody: {
    flex: 1,
    gap: 4,
  },
  methodLabel: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  methodLabelActive: {
    color: "#fff",
  },
  methodDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    lineHeight: 18,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioActive: {
    borderColor: Colors.steel,
  },
  radioActiveGold: {
    borderColor: Colors.gold,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
  },
  radioDotGold: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
  },
  boxPicker: {
    marginTop: 20,
    gap: 8,
  },
  boxPickerLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(229,201,122,0.05)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.15)",
    padding: 14,
  },
  boxRowActive: {
    backgroundColor: "rgba(229,201,122,0.1)",
    borderColor: "rgba(229,201,122,0.35)",
  },
  boxInfo: {
    flex: 1,
    gap: 2,
  },
  boxName: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  boxMeta: {
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
