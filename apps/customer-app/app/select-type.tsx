import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ImageBackground, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore, type ItemType } from "@/store/bookingStore";

const TYPES = [
  {
    id: "luggage",
    icon: "briefcase-outline" as const,
    label: "Luggage",
    desc: "Suitcases, trunks, oversized bags",
    image: require("@/assets/luggage.jpeg"),
  },
  {
    id: "shopping",
    icon: "bag-handle-outline" as const,
    label: "Shopping",
    desc: "Retail bags, boutique parcels, groceries",
    image: require("@/assets/shopping.jpeg"),
  },
  {
    id: "parcels",
    icon: "cube-outline" as const,
    label: "Parcels",
    desc: "Boxes, packages, courier items",
    image: require("@/assets/Parcels.jpeg"),
  },
  {
    id: "other",
    icon: "ellipsis-horizontal-outline" as const,
    label: "Other",
    desc: "Flowers, documents, fragile items",
    image: require("@/assets/other.jpeg"),
  },
];

export default function SelectTypeScreen() {
  const insets = useSafeAreaInsets();
  const { itemType, setItemType } = useBookingStore();
  const [selected, setSelected] = useState<ItemType | null>(itemType);

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
          <Text style={styles.stepLabel}>1 of 4</Text>
        </View>

        {/* Heading */}
        <Text style={styles.eyebrow}>Item Type</Text>
        <Text style={styles.heading}>
          What are you{"\n"}
          <Text style={styles.headingItalic}>sending today?</Text>
        </Text>

        {/* Type cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cards}
        >
          {TYPES.map((t) => {
            const active = selected === t.id;
            return (
              <Pressable
                key={t.id}
                style={({ pressed }) => [
                  styles.card,
                  active && styles.cardActive,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
                onPress={() => setSelected(t.id as ItemType)}
              >
                <ImageBackground
                  source={t.image}
                  style={styles.cardBg}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={["rgba(10,31,58,0.55)", "rgba(5,11,22,0.88)"]}
                    style={styles.cardGradient}
                  >
                    {/* Top row: icon + radio */}
                    <View style={styles.cardTop}>
                      <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                        <Ionicons name={t.icon} size={22} color={active ? Colors.steel : Colors.textMuted} />
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                    </View>

                    {/* Bottom: label + desc */}
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{t.label}</Text>
                      <Text style={styles.cardDesc}>{t.desc}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: selected ? pressed ? 0.85 : 1 : 0.4 }]}
          onPress={() => { if (selected) { setItemType(selected); router.push("/port-details"); } }}
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
    marginBottom: 20,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  cards: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    height: 190,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  cardActive: {
    borderColor: "rgba(111,163,200,0.5)",
    borderWidth: 1.5,
  },
  cardBg: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: "rgba(111,163,200,0.18)",
    borderColor: "rgba(111,163,200,0.4)",
  },
  cardBody: {
    gap: 4,
  },
  cardLabel: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: "rgba(255,255,255,0.7)",
  },
  cardLabelActive: {
    color: "#fff",
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  radioActive: {
    borderColor: Colors.steel,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
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
    marginTop: 12,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
