import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Alert, Modal } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapboxGL from "@rnmapbox/maps";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore, DELIVERY_OPTIONS, type DeliverySpeed } from "@/store/bookingStore";
import { fetchRoute } from "@/services/directions";

const METHODS = [
  {
    id: "priority",
    icon: "flash-outline" as const,
    label: "Priority",
    eta: "15–25 min",
    price: "$28",
    desc: "Next available porter, dispatched immediately.",
  },
  {
    id: "standard",
    icon: "bicycle-outline" as const,
    label: "Standard",
    eta: "35–55 min",
    price: "$18",
    desc: "Efficient delivery at a relaxed pace.",
  },
  {
    id: "scheduled",
    icon: "calendar-outline" as const,
    label: "Scheduled",
    eta: "Choose time",
    price: "From $16",
    desc: "Book a porter for later today or any future date.",
  },
];

const PORTER_OFFSETS = [
  { id: "JR", dlng: -0.006, dlat:  0.003 },
  { id: "MA", dlng:  0.008, dlat:  0.006 },
  { id: "EH", dlng: -0.009, dlat: -0.002 },
  { id: "TK", dlng:  0.001, dlat: -0.005 },
  { id: "LO", dlng:  0.010, dlat:  0.001 },
];

export default function DeliveryMethodScreen() {
  const insets = useSafeAreaInsets();
  const { deliverySpeed, setDeliverySpeed, pickupCoords, dropoffCoords } = useBookingStore();
  const [method, setMethod] = useState<DeliverySpeed>(deliverySpeed);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [mapExpanded, setMapExpanded] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const selected = DELIVERY_OPTIONS[method];

  const pickupLng  = pickupCoords?.lng  ?? -73.9967;
  const pickupLat  = pickupCoords?.lat  ?? 40.7484;
  const dropoffLng = dropoffCoords?.lng ?? -73.9950;
  const dropoffLat = dropoffCoords?.lat ?? 40.7467;
  const pickupCoord:  [number, number] = [pickupLng,  pickupLat];
  const dropoffCoord: [number, number] = [dropoffLng, dropoffLat];

  const porterCoords = PORTER_OFFSETS.map((p) => ({
    id:    p.id,
    coord: [pickupLng + p.dlng, pickupLat + p.dlat] as [number, number],
  }));

  const camNE: [number, number] = [Math.max(pickupLng, dropoffLng) + 0.015, Math.max(pickupLat, dropoffLat) + 0.015];
  const camSW: [number, number] = [Math.min(pickupLng, dropoffLng) - 0.015, Math.min(pickupLat, dropoffLat) - 0.015];

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([pickupCoord, dropoffCoord]);

  useEffect(() => {
    fetchRoute(pickupCoord, dropoffCoord).then(setRouteCoords);
  }, []);

  useEffect(() => { initializePaymentSheet(); }, [method]);

  async function initializePaymentSheet() {
    setPaymentReady(false);
    setPaymentLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: selected.price * 100 }),
        }
      );
      const { clientSecret, error: fnError } = await res.json();
      if (fnError || !clientSecret) throw new Error(fnError ?? "No clientSecret");

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Porter",
        returnURL: "porter://stripe-redirect",
        style: "alwaysDark",
        applePay: { merchantCountryCode: "US" },
        appearance: {
          colors: {
            primary: "#6FA3C8",
            background: "#050B16",
            componentBackground: "#0B2A4A",
            componentText: "#F4F6F8",
            placeholderText: "#F4F6F866",
          },
        },
      });
      if (!error) setPaymentReady(true);
    } catch (e) {
      console.error("Payment init failed:", e);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleConfirmAndBook() {
    if (!paymentReady) return;
    const { error } = await presentPaymentSheet();
    if (error) {
      if (error.code !== "Canceled") Alert.alert("Payment failed", error.message);
      return;
    }
    setDeliverySpeed(method);
    router.push("/finding-porter");
  }

  const mapMarkers = (
    <>
      <MapboxGL.ShapeSource
        id="dmRoute"
        shape={{ type: "Feature", geometry: { type: "LineString", coordinates: routeCoords }, properties: {} }}
      >
        <MapboxGL.LineLayer
          id="dmRouteLine"
          style={{ lineColor: "rgba(111,163,200,0.5)", lineWidth: 2, lineDasharray: [2, 2] }}
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
      {porterCoords.map((p) => (
        <MapboxGL.MarkerView key={p.id} coordinate={p.coord}>
          <View style={styles.porterBadgeView}>
            <Text style={styles.porterBadgeText}>{p.id}</Text>
          </View>
        </MapboxGL.MarkerView>
      ))}
    </>
  );

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
          <Text style={styles.stepLabel}>4 of 4</Text>
        </View>

        {/* Mini map — real route + active porters */}
        <Pressable onPress={() => setMapExpanded(true)}>
          <View style={styles.mapCard}>
            <MapboxGL.MapView
              style={{ flex: 1 }}
              styleURL="mapbox://styles/mapbox/dark-v11"
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              logoEnabled={false}
              attributionEnabled={false}
              compassEnabled={false}
            >
              <MapboxGL.Camera
                bounds={{ ne: camNE, sw: camSW, paddingLeft: 40, paddingRight: 40, paddingTop: 30, paddingBottom: 30 }}
                animationDuration={0}
              />
              {mapMarkers}
            </MapboxGL.MapView>
            <View style={styles.mapPill}>
              <View style={styles.mapPillDot} />
              <Text style={styles.mapPillText}>5 porters nearby</Text>
            </View>
            <View style={styles.expandHint}>
              <Ionicons name="expand-outline" size={13} color={Colors.text} />
              <Text style={styles.expandHintText}>Tap to expand</Text>
            </View>
          </View>
        </Pressable>

        {/* Heading */}
        <Text style={styles.eyebrow}>Delivery Speed</Text>
        <Text style={styles.heading}>
          How soon do you{"\n"}
          <Text style={styles.headingItalic}>need it there?</Text>
        </Text>

        {/* Method options */}
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.methodRow, active && styles.methodRowActive]}
                onPress={() => setMethod(m.id as DeliverySpeed)}
              >
                <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                  <Ionicons name={m.icon} size={18} color={active ? Colors.steel : Colors.textMuted} />
                </View>
                <View style={styles.methodBody}>
                  <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <View style={styles.methodRight}>
                  <Text style={[styles.methodPrice, active && styles.methodPriceActive]}>{m.price}</Text>
                  <Text style={styles.methodEta}>{m.eta}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Payment row */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.paymentText}>
              {paymentLoading ? "Loading payment…" : "Pay with card"}
            </Text>
          </View>
          <Text style={styles.paymentTotal}>${selected.price}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: paymentReady ? (pressed ? 0.85 : 1) : 0.5 }]}
          onPress={handleConfirmAndBook}
          disabled={!paymentReady || paymentLoading}
        >
          <Text style={styles.ctaText}>
            {paymentLoading ? "Preparing…" : "Confirm & Book"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Full-screen interactive map modal */}
      <Modal visible={mapExpanded} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <MapboxGL.MapView
            style={{ flex: 1 }}
            styleURL="mapbox://styles/mapbox/dark-v11"
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapboxGL.Camera
              bounds={{ ne: camNE, sw: camSW, paddingLeft: 60, paddingRight: 60, paddingTop: 80, paddingBottom: 80 }}
              animationDuration={0}
            />
            <MapboxGL.ShapeSource
              id="dmRouteFull"
              shape={{ type: "Feature", geometry: { type: "LineString", coordinates: routeCoords }, properties: {} }}
            >
              <MapboxGL.LineLayer
                id="dmRouteLineFull"
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
            {porterCoords.map((p) => (
              <MapboxGL.MarkerView key={p.id} coordinate={p.coord}>
                <View style={styles.porterBadgeView}>
                  <Text style={styles.porterBadgeText}>{p.id}</Text>
                </View>
              </MapboxGL.MarkerView>
            ))}
          </MapboxGL.MapView>
          <View style={[styles.mapPill, { top: 56 }]}>
            <View style={styles.mapPillDot} />
            <Text style={styles.mapPillText}>5 porters nearby</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.mapCloseBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setMapExpanded(false)}
          >
            <Ionicons name="close" size={20} color={Colors.text} />
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
  stepLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  mapCard: {
    height: 150,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: 20,
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
  porterBadgeView: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  porterBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  mapPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(5,11,22,0.8)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapPillDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
  },
  mapPillText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  expandHint: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5,11,22,0.8)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expandHintText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heading: {
    fontSize: 30,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  methods: {
    gap: 10,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  methodRowActive: {
    backgroundColor: "rgba(111,163,200,0.08)",
    borderColor: "rgba(111,163,200,0.35)",
  },
  methodIcon: {
    width: 38,
    height: 38,
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
    gap: 2,
  },
  methodLabel: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  methodLabelActive: {
    color: "#fff",
  },
  methodDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    lineHeight: 16,
  },
  methodRight: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  methodPrice: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  methodPriceActive: {
    color: "#fff",
  },
  methodEta: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  paymentTotal: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: "#fff",
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
    backgroundColor: "rgba(14,15,18,0.85)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
