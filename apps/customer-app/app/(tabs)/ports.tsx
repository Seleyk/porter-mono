import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getCustomerBookings } from "@/services/booking";
import { ServiceRequest } from "@/lib/database.types";

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
    case "picked_up": return "Items secured";
    case "completed": return "Collected";
    case "cancelled": return "Cancelled";
    default:          return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "pending":
    case "matched":   return Colors.steel;
    case "accepted":
    case "picked_up": return Colors.gold;
    case "completed": return Colors.evergreen;
    default:          return Colors.textDim;
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
  const [boxes, setBoxes] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCustomerBookings(user.id)
      .then((all) => setBoxes(all.filter((b) => isBox(b.special_instructions))))
      .finally(() => setLoading(false));
  }, [user]);

  const active = boxes.filter((b) => ACTIVE_STATUSES.has(b.status));
  const past = boxes.filter((b) => !ACTIVE_STATUSES.has(b.status));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>My Boxes</Text>
              <Text style={styles.heading}>
                Your porter{"\n"}
                <Text style={styles.headingItalic}>boxes.</Text>
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.newBoxBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push("/porter-box-hub")}
            >
              <Ionicons name="add" size={16} color={Colors.bgDeep} />
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
            {/* ── Active boxes ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACTIVE</Text>

              {active.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="cube-outline" size={28} color={Colors.textDim} />
                  </View>
                  <Text style={styles.emptyTitle}>No active boxes</Text>
                  <Text style={styles.emptyDesc}>
                    Book a Porter Box and your active reservations will appear here.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => router.push("/porter-box-hub")}
                  >
                    <Text style={styles.emptyBtnText}>Find a Porter Box</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.steel} />
                  </Pressable>
                </View>
              ) : (
                active.map((box) => (
                  <ActiveBoxCard key={box.id} box={box} />
                ))
              )}
            </View>

            {/* ── Past boxes ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PAST</Text>

              {past.length === 0 ? (
                <Text style={styles.pastEmpty}>No past boxes yet.</Text>
              ) : (
                <View style={styles.pastCard}>
                  {past.map((box, i) => (
                    <View
                      key={box.id}
                      style={[styles.pastRow, i < past.length - 1 && styles.pastRowDivider]}
                    >
                      <View style={styles.pastIconWrap}>
                        <Ionicons name="cube-outline" size={18} color={Colors.textDim} />
                      </View>
                      <View style={styles.pastInfo}>
                        <Text style={styles.pastHub}>{parseHub(box.special_instructions)}</Text>
                        <Text style={styles.pastDate}>{formatDate(box.created_at)}</Text>
                      </View>
                      <View style={styles.pastRight}>
                        {box.total_price != null && (
                          <Text style={styles.pastPrice}>${box.total_price}</Text>
                        )}
                        <View style={[styles.statusPill, { borderColor: statusColor(box.status) + "40" }]}>
                          <Text style={[styles.statusText, { color: statusColor(box.status) }]}>
                            {statusLabel(box.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
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

// ─── Active box card ──────────────────────────────────────────────────────────

function ActiveBoxCard({ box }: { box: ServiceRequest }) {
  const hub = parseHub(box.special_instructions);
  const color = statusColor(box.status);
  const label = statusLabel(box.status);

  return (
    <View style={styles.activeCard}>
      {/* Status bar accent */}
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

        <Text style={styles.activeHub}>{hub}</Text>
        <Text style={styles.activeAddress}>{box.dropoff_address}</Text>

        <View style={styles.activeFooter}>
          <Text style={styles.activeDate}>{formatDate(box.created_at)}</Text>
          {box.total_price != null && (
            <Text style={styles.activePrice}>${box.total_price}</Text>
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

  // Header
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

  // Sections
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 14,
  },

  // Empty state
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

  // Active box card
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
    fontSize: 17,
    fontFamily: Fonts.serifBold,
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

  // Status pill
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

  // Past rows
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
