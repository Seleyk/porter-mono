import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, ImageBackground } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { fetchActivePorterBoxOrders, type PorterBoxOrder } from "@/services/porterBox";
import { useBookingStore } from "@/store/bookingStore";

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useColors();
  const [activeOrders, setActiveOrders] = useState<PorterBoxOrder[]>([]);
  const { porterBoxCode, dropoffMethod, selectedBoxName } = useBookingStore();

  useEffect(() => {
    fetchActivePorterBoxOrders().then(setActiveOrders);
  }, []);

  // Synthetic active order from completed driver-delivered box booking
  const hasStoreOrder = !!porterBoxCode && dropoffMethod === "box";

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.steel }]}>AT YOUR SERVICE</Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            Choose your{"\n"}
            <Text style={[styles.headingItalic, { color: colors.steel }]}>occasion.</Text>
          </Text>
        </View>

        {/* Synthetic active order from store (driver-delivered to box) */}
        {hasStoreOrder && (
          <Pressable
            style={({ pressed }) => [styles.activeOrderCard, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push("/porter-box-hub")}
          >
            <View style={styles.activeOrderTop}>
              <View style={styles.activeOrderPill}>
                <View style={styles.activeOrderDot} />
                <Text style={styles.activeOrderPillText}>READY FOR PICKUP</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(229,201,122,0.6)" />
            </View>
            <Text style={styles.activeOrderName}>
              Porter Box · {selectedBoxName ?? "Hub"}
            </Text>
            <Text style={styles.activeOrderCode}>
              CODE · {(porterBoxCode ?? "----").split("").join(" ")}
            </Text>
          </Pressable>
        )}

        {/* Supabase active orders */}
        {activeOrders.map((order) => (
          <Pressable
            key={order.id}
            style={({ pressed }) => [styles.activeOrderCard, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.push("/porter-box-hub")}
          >
            <View style={styles.activeOrderTop}>
              <View style={styles.activeOrderPill}>
                <View style={styles.activeOrderDot} />
                <Text style={styles.activeOrderPillText}>READY FOR PICKUP</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(229,201,122,0.6)" />
            </View>
            <Text style={styles.activeOrderName}>
              Porter Box · {order.porter_hubs?.name ?? "Hub"}
            </Text>
            <Text style={styles.activeOrderCode}>
              CODE · {(order.pickup_code ?? "----").split("").join(" ")}
            </Text>
          </Pressable>
        ))}

        {/* Porter — compact image card */}
        <Pressable
          style={({ pressed }) => [styles.serviceCard, { opacity: pressed ? 0.92 : 1 }]}
          onPress={() => router.push("/where-to")}
        >
          <ImageBackground
            source={require("@/assets/porter.avif")}
            style={styles.cardBg}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(10,31,58,0.60)", "rgba(5,11,22,0.88)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconWrap}>
                <Ionicons name="briefcase-outline" size={22} color="#6FA3C8" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Porter</Text>
                  <View style={styles.signatureBadge}>
                    <Text style={styles.signatureBadgeText}>SIGNATURE</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={1}>White-glove luggage handling, building to building.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </LinearGradient>
          </ImageBackground>
        </Pressable>

        {/* Porter Box — compact image card */}
        <Pressable
          style={({ pressed }) => [styles.serviceCard, { opacity: pressed ? 0.92 : 1 }]}
          onPress={() => router.push("/porter-box-hub")}
        >
          <ImageBackground
            source={require("@/assets/locker.avif")}
            style={styles.cardBg}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(10,31,58,0.60)", "rgba(5,11,22,0.88)"]}
              style={styles.cardGradient}
            >
              <View style={[styles.cardIconWrap, styles.cardIconWrapGold]}>
                <Ionicons name="cube-outline" size={22} color="#E5C97A" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Porter Box</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>$10 / hr</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={1}>Secure storage by the hour. Drop, explore, collect.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            </LinearGradient>
          </ImageBackground>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginTop: 20, marginBottom: 24 },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heading: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    lineHeight: 44,
    letterSpacing: -0.3,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
  },
  serviceCard: {
    height: 120,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardBg: { flex: 1 },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(111,163,200,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconWrapGold: {
    backgroundColor: "rgba(229,201,122,0.15)",
    borderColor: "rgba(229,201,122,0.3)",
  },
  cardContent: { flex: 1, gap: 5 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Fonts.serifItalic,
    color: "#fff",
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
  },
  signatureBadge: {
    backgroundColor: "rgba(229,201,122,0.12)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  signatureBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: "#E5C97A",
    letterSpacing: 1.5,
  },
  newBadge: {
    backgroundColor: "rgba(111,163,200,0.15)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: "#6FA3C8",
    letterSpacing: 1.5,
  },
  priceBadge: {
    backgroundColor: "rgba(229,201,122,0.12)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: "#E5C97A",
    letterSpacing: 0.5,
  },
  activeOrderCard: {
    backgroundColor: "rgba(229,201,122,0.06)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    padding: 18,
    gap: 8,
    marginBottom: 14,
  },
  activeOrderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeOrderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeOrderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5C97A",
  },
  activeOrderPillText: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: "#E5C97A",
    letterSpacing: 2,
  },
  activeOrderName: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: "#fff",
  },
  activeOrderCode: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: "rgba(244,246,248,0.6)",
    letterSpacing: 1.5,
  },
});
