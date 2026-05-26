import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

const FEATURES = [
  { icon: "shield-checkmark-outline", label: "Identity-verified porters" },
  { icon: "navigate-outline", label: "Live GPS tracking" },
  { icon: "create-outline", label: "Signature on delivery" },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Services</Text>
          <Text style={styles.heading}>
            What would you{"\n"}
            <Text style={styles.headingItalic}>like today?</Text>
          </Text>
        </View>

        {/* Porter Signature card */}
        <Pressable
          style={({ pressed }) => [styles.serviceCard, { opacity: pressed ? 0.92 : 1 }]}
          onPress={() => router.push("/where-to")}
        >
          <LinearGradient
            colors={["rgba(18,62,107,0.7)", "rgba(10,31,58,0.9)"]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>SIGNATURE</Text>
          </View>
          <View style={styles.cardIcon}>
            <Ionicons name="briefcase-outline" size={28} color={Colors.steel} />
          </View>
          <Text style={styles.cardTitle}>Porter</Text>
          <Text style={styles.cardDesc}>
            A dedicated professional delivers your items with white-glove care — door to door.
          </Text>
          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <Ionicons name={f.icon as any} size={14} color={Colors.steel} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>From $18</Text>
            <View style={styles.cardCta}>
              <Text style={styles.cardCtaText}>Book Now</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </View>
        </Pressable>

        {/* Porter Box card */}
        <Pressable
          style={({ pressed }) => [styles.boxCard, { opacity: pressed ? 0.92 : 1 }]}
          onPress={() => router.push("/porter-box-hub")}
        >
          <View style={styles.boxTopRow}>
            <View style={styles.boxIconWrap}>
              <Ionicons name="cube-outline" size={22} color={Colors.gold} />
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.boxTitle}>Porter Box</Text>
          <Text style={styles.boxDesc}>
            Secure, climate-controlled storage lockers near you. Drop off or pick up anytime.
          </Text>
          <View style={styles.boxMeta}>
            <View style={styles.boxMetaItem}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.boxMetaText}>$10 / hr</Text>
            </View>
            <View style={styles.boxMetaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.boxMetaText}>3 locations nearby</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 28,
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
  serviceCard: {
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
    padding: 22,
    marginBottom: 16,
    overflow: "hidden",
    gap: 14,
  },
  cardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(111,163,200,0.15)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
    letterSpacing: 2.5,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: "#fff",
  },
  cardCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardCtaText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  boxCard: {
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    padding: 22,
    gap: 12,
  },
  boxTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  boxIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(229,201,122,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    backgroundColor: "rgba(229,201,122,0.15)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 2.5,
  },
  boxTitle: {
    fontSize: 24,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -0.2,
  },
  boxDesc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  boxMeta: {
    flexDirection: "row",
    gap: 20,
    marginTop: 4,
  },
  boxMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  boxMetaText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
});
