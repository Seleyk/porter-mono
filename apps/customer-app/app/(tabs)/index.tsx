import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

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

const PORTERS = [
  { initials: "JR", x: "24%", y: "50%" },
  { initials: "MA", x: "67%", y: "24%" },
  { initials: "EH", x: "11%", y: "66%" },
  { initials: "TK", x: "41%", y: "72%" },
  { initials: "LO", x: "77%", y: "61%" },
];

const MAP_H = 200;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const firstName = profile?.first_name ?? "there";
  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "?";

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
            {/* Subtle grid lines */}
            {[25, 50, 75].map((p) => (
              <View key={`h${p}`} style={[styles.gridLine, styles.hLine, { top: `${p}%` as any }]} />
            ))}
            {[20, 40, 60, 80].map((p) => (
              <View key={`v${p}`} style={[styles.gridLine, styles.vLine, { left: `${p}%` as any }]} />
            ))}

            {/* Porter avatars */}
            {PORTERS.map((p) => (
              <View
                key={p.initials}
                style={[
                  styles.porterBadge,
                  { left: p.x as any, top: p.y as any, transform: [{ translateX: -16 }, { translateY: -16 }] },
                ]}
              >
                <Text style={styles.porterInitials}>{p.initials}</Text>
              </View>
            ))}

            {/* User location dot */}
            <View
              style={[
                styles.userDot,
                { left: "49%" as any, top: "52%" as any, transform: [{ translateX: -10 }, { translateY: -10 }] },
              ]}
            />

            {/* 5 porters nearby pill */}
            <View style={styles.nearbyPill}>
              <View style={styles.nearbyDot} />
              <Text style={styles.nearbyText}>5 porters nearby</Text>
            </View>

            {/* Expand button */}
            <Pressable style={({ pressed }) => [styles.expandBtn, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={styles.expandText}>Expand</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  hLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  vLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  porterBadge: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  porterInitials: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  userDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: "#D4A843",
    borderWidth: 3,
    borderColor: "rgba(212,168,67,0.3)",
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
});
