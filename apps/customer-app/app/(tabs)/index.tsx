import { useRef, useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Animated, Modal } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import MapboxGL from "@rnmapbox/maps";
import { DEMO_USER_COORDS, DEMO_DRIVERS, DEMO_FAVORITES, DEMO_RECENTS, DEMO_CURRENT_LOCATION } from "@/constants/simulation";
import { useBookingStore } from "@/store/bookingStore";
import { FadeSlideIn } from "@/components/FadeSlideIn";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}


const MIAMI_CENTER: [number, number] = [DEMO_USER_COORDS.lng, DEMO_USER_COORDS.lat];

const FAKE_DRIVERS = DEMO_DRIVERS.map((d) => ({
  id: d.initials,
  coords: [d.coords.lng, d.coords.lat] as [number, number],
}));

const MAP_H = 200;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { pickup, setRoute } = useBookingStore();
  const { colors, isDark } = useColors();
  const firstName = profile?.first_name ?? "there";
  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "?";

  function handleLocationTap(label: string, coords: { lng: number; lat: number }) {
    setRoute(DEMO_CURRENT_LOCATION.label, label, DEMO_CURRENT_LOCATION.coords, coords);
    router.push("/where-to");
  }

  function handleSearchBarTap() {
    if (!pickup) setRoute(DEMO_CURRENT_LOCATION.label, "", DEMO_CURRENT_LOCATION.coords, null);
    router.push("/where-to");
  }

  const [mapExpanded, setMapExpanded] = useState(false);
  const radar1 = useRef(new Animated.Value(0)).current;
  const radar2 = useRef(new Animated.Value(0)).current;
  const radar3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeRadar = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    makeRadar(radar1, 0).start();
    makeRadar(radar2, 700).start();
    makeRadar(radar3, 1400).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bgDeep }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {firstName}<Text style={styles.namePeriod}>.</Text>
            </Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
          </View>
        </View>

        {/* Search bar */}
        <Pressable style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={handleSearchBarTap}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Where to?</Text>
          <View style={[styles.nowPill, { backgroundColor: colors.buttonSecondary }]}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.nowText, { color: colors.textSecondary }]}>Now</Text>
          </View>
        </Pressable>

        {/* Favorites */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FAVORITES</Text>
            <Pressable>
              <Text style={styles.sectionAction}>Edit</Text>
            </Pressable>
          </View>
          {DEMO_FAVORITES.map((f, i) => (
            <FadeSlideIn key={f.label} delay={i * 60}>
              <Pressable
                style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleLocationTap(f.label, f.coords)}
              >
                <View style={[styles.listIconBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Ionicons name={f.icon as any} size={18} color={f.iconColor} />
                </View>
                <View style={styles.listText}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>{f.label}</Text>
                  <Text style={[styles.listSub, { color: colors.textSecondary }]}>{f.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
              </Pressable>
            </FadeSlideIn>
          ))}
        </View>

        {/* Frequent Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FREQUENT DESTINATIONS</Text>
          </View>
          {DEMO_RECENTS.map((r, i) => (
            <FadeSlideIn key={r.label} delay={i * 60}>
              <Pressable
                style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleLocationTap(r.label, r.coords)}
              >
                <View style={[styles.listIconBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.listText}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>{r.label}</Text>
                  <Text style={[styles.listSub, { color: colors.textSecondary }]}>{r.sub}</Text>
                </View>
              </Pressable>
            </FadeSlideIn>
          ))}
        </View>

        {/* Active Porters */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVE PORTERS</Text>
            <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>Within 0.6 mi</Text>
          </View>

          <View style={[styles.mapCard, { height: MAP_H, borderColor: colors.cardBorder }]}>
            <MapboxGL.MapView
              style={{ flex: 1 }}
              styleURL={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/navigation-day-v1"}
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
                centerCoordinate={MIAMI_CENTER}
                animationDuration={0}
              />

              {/* User dot */}
              <MapboxGL.MarkerView coordinate={MIAMI_CENTER}>
                <View style={styles.userDot} />
              </MapboxGL.MarkerView>

              {/* Pulsing driver markers */}
              {FAKE_DRIVERS.map((d) => (
                <MapboxGL.MarkerView key={d.id} coordinate={d.coords}>
                  <View style={styles.driverMarkerWrap}>
                    {[radar1, radar2, radar3].map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[styles.radarRing, {
                          opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
                          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3.5] }) }],
                        }]}
                      />
                    ))}
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <MapboxGL.MapView
            style={{ flex: 1 }}
            styleURL={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/navigation-day-v1"}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapboxGL.Camera
              zoomLevel={14.5}
              centerCoordinate={MIAMI_CENTER}
              animationDuration={0}
            />
            <MapboxGL.MarkerView coordinate={MIAMI_CENTER}>
              <View style={styles.userDot} />
            </MapboxGL.MarkerView>
            {FAKE_DRIVERS.map((d) => (
              <MapboxGL.MarkerView key={d.id} coordinate={d.coords}>
                <View style={styles.driverMarkerWrap}>
                  <Animated.View
                    style={[styles.radarRing, {
                      opacity: radar1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                      transform: [{ scale: radar1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
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
    width: 100,
    height: 100,
  },
  radarRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    backgroundColor: "transparent",
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
