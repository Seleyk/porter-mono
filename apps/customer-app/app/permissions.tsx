import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

const PERMS = [
  {
    icon: "location-outline" as const,
    title: "Location",
    desc: "So porters can find you, and you can watch their arrival in real time.",
  },
  {
    icon: "notifications-outline" as const,
    title: "Notifications",
    desc: "Discreet updates the moment a porter is on the way, or near your door.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Identity Verification",
    desc: "A one-time check that protects every parcel you send.",
  },
];

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>Final Touches</Text>
          <Text style={styles.heading}>
            A few small permissions,{"\n"}
            <Text style={styles.headingItalic}>for service worth waiting on.</Text>
          </Text>
        </View>

        <View style={styles.cards}>
          {PERMS.map((p) => (
            <View
              key={p.title}
              style={[styles.card, { opacity: 1 }]}
            >
              <View style={styles.iconBox}>
                <Ionicons name={p.icon} size={22} color={Colors.steel} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.ctaText}>Allow & Continue</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
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
  skip: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  headingBlock: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  heading: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 44,
    letterSpacing: -0.3,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  cards: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    padding: 18,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: "#fff",
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 19,
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
