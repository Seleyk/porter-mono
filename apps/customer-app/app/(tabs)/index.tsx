import { useRef, useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Animated, Modal } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import MapboxGL from "@rnmapbox/maps";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

const FAVORITES = [
  { icon: "home-outline", label: "240 Park Hill Ave", sub: "Home · New York, NY", iconColor: Colors.primaryLight },
  { icon: "briefcase-outline", label: "10 W 13th St", sub: "Work · New York, NY", iconColor: Colors.primaryLight },
  { icon: "star", label: "The Carlyle", sub: "Favorite · 35 E 76th St", iconColor: "#D4A843" },
];

const RECENT = [
  { label: "Saks Fifth Avenue", sub: "611 Fifth Ave · 10 min ago" },
  { label: "The Museum of Modern Art", sub: "11 W 53rd St · 4 days ago" },
  { label: "553 W 161st St", sub: "New York, NY · last week" },
];

const NYC_CENTER: [number, number] = [-73.9967, 40.7484];

const FAKE_DRIVERS = [
  { id: "JR", coords: [-73.9940, 40.7501] as [number, number] },
  { id: "MA", coords: [-73.9995, 40.7512] as [number, number] },
  { id: "EH", coords: [-73.9930, 40.7469] as [number, number] },
  { id: "TK", coords: [-73.9978, 40.7460] as [number, number] },
  { id: "LO", coords: [-73.9950, 40.7490] as [number, number] },
];

const MAP_H = 200;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const firstName = profile?.first_name ?? "there";
  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "?";

  const [mapExpanded, setMapExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>
              {firstName}<Text style={styles.namePeriod}>.</Text>
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Search bar */}
        <Pressable style={styles.searchBar} onPress={() => router.push("/where-to")}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Where to?</Text>
          <View style={styles.nowPill}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.nowText}>Now</Text>
          </View>
        </Pressable>

        {/* Favorites */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>FAVORITES</Text>
            <Pressable>
              <Text style={styles.sectionAction}>Edit</Text>
            </Pressable>
          </View>
          {FAVORITES.map((f) => (
            <Pressable
              key={f.label}
              style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.listIconBox}>
                <Ionicons name={f.icon as any} size={18} color={f.iconColor} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{f.label}</Text>
                <Text style={styles.listSub}>{f.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {/* Frequent Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>FREQUENT DESTINATIONS</Text>
          </View>
          {RECENT.map((r) => (
            <Pressable
              key={r.label}
              style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.listIconBox}>
                <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{r.label}</Text>
                <Text style={styles.listSub}>{r.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Active Porters */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>ACTIVE PORTERS</Text>
            <Text style={styles.sectionMeta}>Within 0.6 mi</Text>
          </View>

          <View style={[styles.mapCard, { height: MAP_H }]}>
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
                zoomLevel={14.5}
                centerCoordinate={NYC_CENTER}
                animationDuration={0}
              />

              {/* User dot */}
              <MapboxGL.MarkerView coordinate={NYC_CENTER}>
                <View style={styles.userDot} />
              </MapboxGL.MarkerView>

              {/* Pulsing driver markers */}
              {FAKE_DRIVERS.map((d) => (
                <MapboxGL.MarkerView key={d.id} coordinate={d.coords}>
                  <View style={styles.driverMarkerWrap}>
                    <Animated.View
                      style={[styles.driverPulse, {
                        opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                        transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                      }]}
                    />
                    <View style={styles.driverBadge}>
                      <Text style={styles.driverInitials}>{d.id}</Text>
                    </View>
                  </View>
                </MapboxGL.MarkerView>
              ))}
            </MapboxGL.MapView>

            {/* Overlays */}
            <View style={styles.nearbyPill}>
              <View style={styles.nearbyDot} />
              <Text style={styles.nearbyText}>5 porters nearby</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.expandBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setMapExpanded(true)}
            >
              <Text style={styles.expandText}>Expand</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Full-screen Active Porters modal */}
      <Modal visible={mapExpanded} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <MapboxGL.MapView
            style={{ flex: 1 }}
            styleURL="mapbox://styles/mapbox/dark-v11"
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapboxGL.Camera
              zoomLevel={14.5}
              centerCoordinate={NYC_CENTER}
              animationDuration={0}
            />
            <MapboxGL.MarkerView coordinate={NYC_CENTER}>
              <View style={styles.userDot} />
            </MapboxGL.MarkerView>
            {FAKE_DRIVERS.map((d) => (
              <MapboxGL.MarkerView key={d.id} coordinate={d.coords}>
                <View style={styles.driverMarkerWrap}>
                  <Animated.View
                    style={[styles.driverPulse, {
                      opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                      transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                    }]}
                  />
                  <View style={styles.driverBadge}>
                    <Text style={styles.driverInitials}>{d.id}</Text>
                  </View>
                </View>
              </MapboxGL.MarkerView>
            ))}
          </MapboxGL.MapView>
          <Pressable
            style={({ pressed }) => [styles.mapCloseBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setMapExpanded(false)}
          >
            <Ionicons name="close" size={20} color={Colors.text} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  name: {
    fontSize: 42,
    fontFamily: Fonts.serif,
    color: Colors.text,
    lineHeight: 48,
  },
  namePeriod: {
    color: Colors.steel,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  avatarText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 28,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  nowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nowText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 28,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.primaryLight,
  },
  sectionMeta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  listIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  listSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  mapCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    position: "relative",
  },
  userDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#D4A843",
    borderWidth: 3,
    borderColor: "rgba(212,168,67,0.3)",
  },
  driverMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  driverPulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.steel,
  },
  driverBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitials: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  nearbyPill: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(14,15,18,0.75)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nearbyDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.text,
  },
  nearbyText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  expandBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(14,15,18,0.75)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
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
