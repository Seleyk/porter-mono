import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Modal, Linking } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapboxGL from "@rnmapbox/maps";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { useBookingStore } from "@/store/bookingStore";
import { useLiveBooking } from "@/hooks/useLiveBooking";
import { DEMO_USER_COORDS, mapStyleFor } from "@porter/shared";
import { fetchRoute } from "@/services/directions";

const STAGES = [
  { id: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" as const },
  { id: "enroute", label: "En Route", icon: "navigate-outline" as const },
  { id: "arrived", label: "Arrived", icon: "location-outline" as const },
  { id: "transit", label: "In Transit", icon: "car-outline" as const },
  { id: "delivered", label: "Delivered", icon: "home-outline" as const },
];

/** Porter counts as "arrived" within this distance of the pickup. */
const ARRIVED_METERS = 150;
/** Re-fetch the ETA after the porter moves this far. */
const REROUTE_METERS = 200;

function metersBetween(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, bgGradient } = useColors();
  const { bookingId, pickup, dropoff, pickupCoords, dropoffCoords,
    assignedDriverName, assignedDriverInitials,
    dropoffMethod, porterBoxCode, reset } = useBookingStore();
  const { booking, porter, position } = useLiveBooking(bookingId);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Prefer the booking row; fall back to what the booking flow had.
  const pickupCoord: [number, number] = booking
    ? [booking.pickup_longitude, booking.pickup_latitude]
    : [pickupCoords?.lng ?? DEMO_USER_COORDS.lng, pickupCoords?.lat ?? DEMO_USER_COORDS.lat];
  const dropoffCoord: [number, number] = booking
    ? [booking.dropoff_longitude, booking.dropoff_latitude]
    : [dropoffCoords?.lng ?? DEMO_USER_COORDS.lng + 0.012, dropoffCoords?.lat ?? DEMO_USER_COORDS.lat - 0.008];
  const pickupLabel = booking?.pickup_address ?? pickup;
  const dropoffLabel = booking?.dropoff_address ?? dropoff;

  const status = booking?.status ?? "pending";
  const cancelled = status === "cancelled";
  const driverCoord: [number, number] | null = position ? [position.lng, position.lat] : null;
  const arrived = status === "accepted" && !!driverCoord && metersBetween(driverCoord, pickupCoord) <= ARRIVED_METERS;
  const stageIdx =
    status === "completed" ? 4 :
    status === "picked_up" ? 3 :
    status === "accepted" ? (arrived ? 2 : 1) :
    0;

  // The trip itself (pickup → drop-off), once the booking has loaded.
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([pickupCoord, dropoffCoord]);
  const [transitEtaMin, setTransitEtaMin] = useState<number | null>(null);
  useEffect(() => {
    if (!booking) return;
    fetchRoute(pickupCoord, dropoffCoord).then((r) => {
      setRouteCoords(r.coords);
      setTransitEtaMin(r.durationMinutes ? Math.round(r.durationMinutes) : null);
    });
  }, [booking?.id]);

  // The porter's leg to their next stop, refreshed as they move.
  const target = status === "picked_up" ? dropoffCoord : pickupCoord;
  const [legCoords, setLegCoords] = useState<[number, number][] | null>(null);
  const [legEtaMin, setLegEtaMin] = useState<number | null>(null);
  const [legFrom, setLegFrom] = useState<{ coord: [number, number]; status: string } | null>(null);
  useEffect(() => {
    if (!driverCoord || (status !== "accepted" && status !== "picked_up")) {
      setLegCoords(null);
      setLegEtaMin(null);
      setLegFrom(null);
      return;
    }
    // Re-route when the porter has moved enough, or moved on to the drop-off.
    if (legFrom && legFrom.status === status && metersBetween(legFrom.coord, driverCoord) < REROUTE_METERS) return;
    setLegFrom({ coord: driverCoord, status });
    fetchRoute(driverCoord, target).then((r) => {
      setLegCoords(r.coords);
      setLegEtaMin(r.durationMinutes ? Math.max(1, Math.round(r.durationMinutes)) : null);
    });
  }, [driverCoord?.[0], driverCoord?.[1], status]);

  const lineCoords = legCoords ?? routeCoords;
  const framePoints = [pickupCoord, dropoffCoord, ...(driverCoord ? [driverCoord] : [])];
  const camNE: [number, number] = [
    Math.max(...framePoints.map((p) => p[0])) + 0.01,
    Math.max(...framePoints.map((p) => p[1])) + 0.01,
  ];
  const camSW: [number, number] = [
    Math.min(...framePoints.map((p) => p[0])) - 0.01,
    Math.min(...framePoints.map((p) => p[1])) - 0.01,
  ];

  const stage = STAGES[stageIdx];
  const porterEtaMin = status === "accepted" ? legEtaMin ?? "—" : "—";
  const deliveryEtaMin = status === "picked_up" ? legEtaMin ?? transitEtaMin ?? "—" : transitEtaMin ?? "—";

  const porterName = porter ? `${porter.first_name} ${porter.last_name[0] ?? ""}.` : assignedDriverName ?? "Your Porter";
  const porterInitials = porter
    ? `${porter.first_name[0] ?? ""}${porter.last_name[0] ?? ""}`.toUpperCase()
    : assignedDriverInitials ?? "P";
  const vehicle = porter
    ? [porter.vehicle_color, porter.vehicle_make, porter.vehicle_model].filter(Boolean).join(" ")
    : "";
  const porterDetail = [vehicle, porter?.license_plate].filter(Boolean).join(" · ") || "Identity verified";
  const callPorter = porter?.phone ? () => Linking.openURL(`tel:${porter.phone!.replace(/[^\d+]/g, "")}`) : undefined;

  const stops = [
    {
      label: pickupLabel || "Pickup location",
      sub: stageIdx >= 3 ? "Pickup · Collected" : stageIdx === 2 ? "Pickup · Porter arrived" : `Pickup · ~${porterEtaMin} min`,
      done: stageIdx >= 2,
    },
    {
      label: dropoffLabel || "Drop-off location",
      sub: stageIdx >= 4 ? "Drop-off · Delivered" : `Drop-off · ~${deliveryEtaMin} min`,
      done: stageIdx >= 4,
    },
  ];

  return (
    <LinearGradient colors={[...bgGradient]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={[styles.titleText, { color: colors.text }]}>Live Tracking</Text>
          <Pressable style={styles.helpBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
          {/* Live map */}
          <Pressable onPress={() => setMapExpanded(true)}>
            <View style={styles.mapCard}>
              <MapboxGL.MapView
                style={{ flex: 1 }}
                styleURL={mapStyleFor(isDark)}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
                compassEnabled={false}
              >
                <MapboxGL.Camera
                  bounds={{ ne: camNE, sw: camSW, paddingLeft: 50, paddingRight: 50, paddingTop: 40, paddingBottom: 40 }}
                  animationDuration={600}
                />

                {/* Dashed route line */}
                <MapboxGL.ShapeSource
                  id="route"
                  shape={{ type: "Feature", geometry: { type: "LineString", coordinates: lineCoords }, properties: {} }}
                >
                  <MapboxGL.LineLayer
                    id="routeLine"
                    style={{ lineColor: "rgba(111,163,200,0.5)", lineWidth: 2, lineDasharray: [2, 2] }}
                  />
                </MapboxGL.ShapeSource>

                {/* Pickup marker */}
                <MapboxGL.MarkerView coordinate={pickupCoord}>
                  <View style={styles.pickupMarker}>
                    <Ionicons name="location" size={14} color={Colors.gold} />
                  </View>
                </MapboxGL.MarkerView>

                {/* Dropoff marker */}
                <MapboxGL.MarkerView coordinate={dropoffCoord}>
                  <View style={styles.dropoffMarker}>
                    <Ionicons name="flag" size={12} color={Colors.steel} />
                  </View>
                </MapboxGL.MarkerView>

                {/* Animated driver marker */}
                {driverCoord && (
                  <MapboxGL.MarkerView coordinate={driverCoord}>
                    <View style={styles.activePorter}>
                      <Text style={styles.activePorterText}>P</Text>
                    </View>
                  </MapboxGL.MarkerView>
                )}
              </MapboxGL.MapView>

              {/* Expand hint */}
              <View style={styles.expandHint}>
                <Ionicons name="expand-outline" size={13} color={colors.text} />
                <Text style={styles.expandHintText}>Tap to expand</Text>
              </View>
            </View>
          </Pressable>

          {/* Stage progress bar */}
          <View style={styles.stageBar}>
            {STAGES.map((s, i) => (
              <View key={s.id} style={styles.stageItem}>
                <View style={[styles.stageCircle, { backgroundColor: colors.card, borderColor: colors.cardBorder }, i <= stageIdx && styles.stageCircleActive]}>
                  <Ionicons name={s.icon} size={13} color={i <= stageIdx ? "#fff" : Colors.textDim} />
                </View>
                <Text style={[styles.stageLabel, i <= stageIdx && styles.stageLabelActive]}>{s.label}</Text>
                {i < STAGES.length - 1 && (
                  <View style={[styles.stageLine, { backgroundColor: colors.divider }, i < stageIdx && styles.stageLineActive]} />
                )}
              </View>
            ))}
          </View>

          {/* Status card */}
          <View style={[styles.statusCard, { backgroundColor: colors.cardElev, borderColor: colors.cardElevBorder }]}>
            <View style={styles.statusRow}>
              <View style={styles.statusIconWrap}>
                <Ionicons name={stage.icon} size={20} color={Colors.steel} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>{cancelled ? "Cancelled" : stage.label}</Text>
                <Text style={[styles.statusEta, { color: colors.textMuted }]}>
                  {cancelled && "This booking was cancelled"}
                  {!cancelled && stageIdx === 0 && "Waiting for a porter to accept"}
                  {!cancelled && stageIdx === 1 && <><Text>Porter arriving in </Text><Text style={styles.statusEtaNum}>~{porterEtaMin} min</Text></>}
                  {!cancelled && stageIdx === 2 && "Your porter is at the pickup"}
                  {!cancelled && stageIdx === 3 && <><Text>Delivery in </Text><Text style={styles.statusEtaNum}>~{deliveryEtaMin} min</Text></>}
                  {!cancelled && stageIdx >= 4 && "Delivered"}
                </Text>
              </View>
            </View>
          </View>

          {/* Verification code — porter box delivery only, shown when driver arrives */}
          {dropoffMethod === "box" && stageIdx === 2 && porterBoxCode && (
            <View style={styles.verifyCard}>
              <Text style={styles.verifyEyebrow}>VERIFICATION CODE</Text>
              <View style={styles.verifyDigits}>
                {porterBoxCode.split("").map((d, i) => (
                  <Text key={i} style={styles.verifyDigit}>{d}</Text>
                ))}
              </View>
              <Text style={styles.verifySub}>
                Share with {porter?.first_name ?? "your porter"} to authorize the handoff.
              </Text>
            </View>
          )}

          {/* Porter card */}
          <View style={[styles.porterCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.porterAvatar}>
              <Text style={styles.porterAvatarText}>
                {porterInitials}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.porterName, { color: colors.text }]}>{porterName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.gold} />
                <Text style={[styles.ratingText, { color: colors.textMuted }]} numberOfLines={1}>{porterDetail}</Text>
              </View>
            </View>
            <View style={styles.porterActions}>
              <Pressable
                onPress={callPorter}
                disabled={!callPorter}
                style={[styles.porterActionBtn, { backgroundColor: colors.buttonSecondary, borderColor: colors.cardBorder, opacity: callPorter ? 1 : 0.4 }]}
              >
                <Ionicons name="call-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable style={[styles.porterActionBtn, { backgroundColor: colors.buttonSecondary, borderColor: colors.cardBorder }]}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Route stops */}
          <View style={[styles.routeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.routeLabel, { color: colors.textDim }]}>ROUTE</Text>
            {stops.map((s, i) => (
              <View key={i} style={styles.stopRow}>
                <View style={styles.stopDotCol}>
                  <View style={[styles.stopDot, { backgroundColor: colors.card, borderColor: colors.cardBorder }, s.done && styles.stopDotDone]} />
                  {i < stops.length - 1 && <View style={[styles.stopLine, { backgroundColor: colors.divider }]} />}
                </View>
                <View style={styles.stopBody}>
                  <Text style={[styles.stopLabel, { color: colors.textMuted }, s.done && styles.stopLabelDone, s.done && { color: colors.text }]} numberOfLines={1}>{s.label}</Text>
                  <Text style={[styles.stopSub, { color: colors.textMuted }]}>{s.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {cancelled ? (
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1, marginTop: 12 }]}
            onPress={() => { reset(); router.replace("/(tabs)"); }}
          >
            <Text style={styles.ctaText}>Back to home</Text>
          </Pressable>
        ) : stageIdx === STAGES.length - 1 && (
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1, marginTop: 12 }]}
            onPress={() => router.push("/proof-of-delivery")}
          >
            <Text style={styles.ctaText}>
              {dropoffMethod === "box" ? "Your items are secured →" : "View Delivery Confirmation"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Full-screen map modal */}
      <Modal visible={mapExpanded} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <MapboxGL.MapView
            style={{ flex: 1 }}
            styleURL={mapStyleFor(isDark)}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapboxGL.Camera
              bounds={{ ne: camNE, sw: camSW, paddingLeft: 60, paddingRight: 60, paddingTop: 80, paddingBottom: 80 }}
              animationDuration={0}
            />

            {/* Route line */}
            <MapboxGL.ShapeSource
              id="routeFull"
              shape={{ type: "Feature", geometry: { type: "LineString", coordinates: lineCoords }, properties: {} }}
            >
              <MapboxGL.LineLayer
                id="routeLineFull"
                style={{ lineColor: "rgba(111,163,200,0.6)", lineWidth: 3, lineDasharray: [2, 2] }}
              />
            </MapboxGL.ShapeSource>

            <MapboxGL.MarkerView coordinate={pickupCoord}>
              <View style={styles.pickupMarker}>
                <Ionicons name="location" size={14} color={Colors.gold} />
              </View>
            </MapboxGL.MarkerView>

            <MapboxGL.MarkerView coordinate={dropoffCoord}>
              <View style={styles.dropoffMarker}>
                <Ionicons name="flag" size={12} color={Colors.steel} />
              </View>
            </MapboxGL.MarkerView>

            {driverCoord && (
              <MapboxGL.MarkerView coordinate={driverCoord}>
                <View style={styles.activePorter}>
                  <Text style={styles.activePorterText}>P</Text>
                </View>
              </MapboxGL.MarkerView>
            )}
          </MapboxGL.MapView>

          <Pressable
            style={({ pressed }) => [styles.mapCloseBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setMapExpanded(false)}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>
      </Modal>
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
    overflow: "hidden",
  },
  activePorter: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  pickupMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(229,201,122,0.15)",
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  dropoffMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(111,163,200,0.15)",
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
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
  verifyCard: {
    backgroundColor: "rgba(10,20,35,0.85)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  verifyEyebrow: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 3,
  },
  verifyDigits: {
    flexDirection: "row",
    gap: 14,
  },
  verifyDigit: {
    fontSize: 44,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -1,
  },
  verifySub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    flexShrink: 0,
  },
  skipText: {
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
  mapCloseBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14,15,18,0.8)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  expandHint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(14,15,18,0.75)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandHintText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
});
