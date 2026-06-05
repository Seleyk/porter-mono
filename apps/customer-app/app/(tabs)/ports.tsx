import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBookingStore } from "@/store/bookingStore";
import { getCustomerBookings } from "@/services/booking";
import { ServiceRequest } from "@/lib/database.types";
import { FadeSlideIn } from "@/components/FadeSlideIn";

// ─── helpers ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(["pending", "matched", "accepted", "picked_up"]);

function isBox(s: string | null) {
  return s?.includes("[dropoff:box]") ?? false;
}

function parseHub(s: string | null): string {
  return s?.match(/\[hub:([^\]]+)\]/)?.[1] ?? "Porter Box";
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":   return "Awaiting porter";
    case "matched":   return "Porter assigned";
    case "accepted":  return "Porter en route";
    case "picked_up": return "In transit";
    case "completed": return "Delivered";
    case "cancelled": return "Cancelled";
    default:          return status;
  }
}

function statusColor(status: string, colors: ReturnType<typeof useColors>["colors"]): string {
  switch (status) {
    case "pending":
    case "matched":   return Colors.steel;
    case "accepted":
    case "picked_up": return Colors.gold;
    case "completed": return Colors.evergreen;
    default:          return colors.textDim;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function PortsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useColors();
  const [bookings, setBookings] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCustomerBookings(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  const active = bookings.filter((b) => ACTIVE_STATUSES.has(b.status));
  const past   = bookings.filter((b) => !ACTIVE_STATUSES.has(b.status));

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDeep }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>Activity</Text>
              <Text style={[styles.heading, { color: colors.text }]}>
                Your porter{"\n"}
                <Text style={styles.headingItalic}>history.</Text>
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.newBoxBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push("/porter-box-hub")}
            >
              <Ionicons name="cube-outline" size={15} color={Colors.bgDeep} />
              <Text style={styles.newBoxText}>New Box</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.steel} />
          </View>
        ) : (
          <>
            {/* ── Active ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVE</Text>

              {active.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.card }]}>
                    <Ionicons name="navigate-outline" size={28} color={colors.textDim} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No active bookings</Text>
                  <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                    Book a delivery or Porter Box and it will appear here in real time.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => router.push("/where-to")}
                  >
                    <Text style={styles.emptyBtnText}>Book a delivery</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.steel} />
                  </Pressable>
                </View>
              ) : (
                active.map((b, i) =>
                  isBox(b.special_instructions)
                    ? <FadeSlideIn key={b.id} delay={Math.min(i, 5) * 60}><ActiveBoxCard box={b} /></FadeSlideIn>
                    : <FadeSlideIn key={b.id} delay={Math.min(i, 5) * 60}><ActiveDeliveryCard booking={b} /></FadeSlideIn>
                )
              )}
            </View>

            {/* ── Past ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PAST</Text>

              {past.length === 0 ? (
                <Text style={[styles.pastEmpty, { color: colors.textDim }]}>No past bookings yet.</Text>
              ) : (
                <View style={[styles.pastCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {past.map((b, i) => (
                    <FadeSlideIn key={b.id} delay={Math.min(i, 5) * 60}>
                      <View
                        style={[styles.pastRow, i < past.length - 1 && styles.pastRowDivider, i < past.length - 1 && { borderBottomColor: colors.cardBorder }]}
                      >
                        <View style={[styles.pastIconWrap, { backgroundColor: colors.buttonSecondary }]}>
                          <Ionicons
                            name={isBox(b.special_instructions) ? "cube-outline" : "car-outline"}
                            size={18}
                            color={colors.textDim}
                          />
                        </View>
                        <View style={styles.pastInfo}>
                          <Text style={[styles.pastHub, { color: colors.text }]} numberOfLines={1}>
                            {isBox(b.special_instructions)
                              ? parseHub(b.special_instructions)
                              : b.pickup_address ?? "Pickup"}
                          </Text>
                          <Text style={[styles.pastDate, { color: colors.textDim }]}>
                            {isBox(b.special_instructions)
                              ? formatDate(b.created_at)
                              : `→ ${b.dropoff_address ?? "Dropoff"} · ${formatDate(b.created_at)}`}
                          </Text>
                        </View>
                        <View style={styles.pastRight}>
                          {b.total_price != null && (
                            <Text style={[styles.pastPrice, { color: colors.textMuted }]}>${b.total_price}</Text>
                          )}
                          <View style={[styles.statusPill, { borderColor: statusColor(b.status, colors) + "40" }]}>
                            <Text style={[styles.statusText, { color: statusColor(b.status, colors) }]}>
                              {statusLabel(b.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </FadeSlideIn>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Active delivery card ─────────────────────────────────────────────────────

function ActiveDeliveryCard({ booking }: { booking: ServiceRequest }) {
  const { colors } = useColors();
  const color = statusColor(booking.status, colors);
  const label = statusLabel(booking.status);
  const { setRoute, setBookingId } = useBookingStore();

  function handleTrack() {
    setRoute(booking.pickup_address ?? "", booking.dropoff_address ?? "", null, null);
    setBookingId(booking.id);
    router.push("/tracking");
  }

  return (
    <View style={[styles.activeCard, { backgroundColor: colors.cardElev, borderColor: colors.cardElevBorder }]}>
      <View style={[styles.activeAccent, { backgroundColor: color }]} />
      <View style={styles.activeContent}>
        <View style={styles.activeTopRow}>
          <View style={[styles.activeIconWrap, { backgroundColor: "rgba(111,163,200,0.1)", borderColor: "rgba(111,163,200,0.2)" }]}>
            <Ionicons name="car-outline" size={20} color={Colors.steel} />
          </View>
          <View style={[styles.statusPill, { borderColor: color + "50" }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={[styles.activeHub, { color: colors.text }]} numberOfLines={1}>{booking.pickup_address}</Text>
        <Text style={[styles.activeAddress, { color: colors.textMuted }]} numberOfLines={1}>→ {booking.dropoff_address}</Text>
        <View style={styles.activeFooter}>
          <Text style={[styles.activeDate, { color: colors.textDim }]}>{formatDate(booking.created_at)}</Text>
          <Pressable
            style={({ pressed }) => [styles.trackBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleTrack}
          >
            <Ionicons name="navigate-outline" size={13} color={Colors.bgDeep} />
            <Text style={styles.trackBtnText}>Track</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Active box card ──────────────────────────────────────────────────────────

function ActiveBoxCard({ box }: { box: ServiceRequest }) {
  const { colors } = useColors();
  const hub   = parseHub(box.special_instructions);
  const color = statusColor(box.status, colors);
  const label = statusLabel(box.status);

  return (
    <View style={[styles.activeCard, { backgroundColor: colors.cardElev, borderColor: colors.cardElevBorder }]}>
      <View style={[styles.activeAccent, { backgroundColor: color }]} />
      <View style={styles.activeContent}>
        <View style={styles.activeTopRow}>
          <View style={styles.activeIconWrap}>
            <Ionicons name="cube-outline" size={20} color={Colors.gold} />
          </View>
          <View style={[styles.statusPill, { borderColor: color + "50" }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={[styles.activeHub, { color: colors.text }]}>{hub}</Text>
        <Text style={[styles.activeAddress, { color: colors.textMuted }]}>{box.dropoff_address}</Text>
        <View style={styles.activeFooter}>
          <Text style={[styles.activeDate, { color: colors.textDim }]}>{formatDate(box.created_at)}</Text>
          {box.total_price != null && (
            <Text style={[styles.activePrice, { color: colors.text }]}>${box.total_price}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingHorizontal: 20 },

  header: { marginTop: 20, marginBottom: 28 },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.gold,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heading: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 42,
    letterSpacing: -0.3,
  },
  headingItalic: { fontFamily: Fonts.serifItalic, color: Colors.gold },
  newBoxBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 6,
  },
  newBoxText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Colors.bgDeep,
    letterSpacing: 0.2,
  },

  loadingWrap: { paddingTop: 60, alignItems: "center" },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 14,
  },

  emptyCard: {
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.xl,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(111,163,200,0.08)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.steel,
  },

  activeCard: {
    backgroundColor: Colors.cardElev,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.cardElevBorder,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
  },
  activeAccent: {
    width: 4,
    borderRadius: 2,
    margin: 12,
    marginRight: 0,
    minHeight: 80,
  },
  activeContent: { flex: 1, padding: 16, gap: 8 },
  activeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(229,201,122,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeHub: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  activeAddress: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  activeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  activeDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  activePrice: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.steel,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trackBtnText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.bgDeep,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
  },

  pastEmpty: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    paddingLeft: 4,
  },
  pastCard: {
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  pastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pastRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  pastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.buttonSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pastInfo: { flex: 1, gap: 3 },
  pastHub: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  pastDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  pastRight: { alignItems: "flex-end", gap: 4 },
  pastPrice: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
});
