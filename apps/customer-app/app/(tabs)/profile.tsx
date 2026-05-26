import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/lib/database.types";

function calcCompletion(profile: Profile | null): number {
  if (!profile) return 0;
  let filled = 2; // first + last always present after setup
  if (profile.phone) filled++;
  if (profile.avatar_url) filled++;
  return Math.round((filled / 4) * 100);
}

const QUICK_ACTIONS = [
  { icon: "time-outline", label: "Activity", sub: "Delivery history" },
  { icon: "wallet-outline", label: "Wallet", sub: "Easy pay" },
  { icon: "chatbubble-ellipses-outline", label: "Messages", sub: "Chat now" },
  { icon: "help-circle-outline", label: "Help", sub: "Support" },
] as const;

const SETTINGS = [
  { icon: "person-outline" as const, label: "Edit Profile" },
  { icon: "notifications-outline" as const, label: "Notifications" },
  { icon: "shield-checkmark-outline" as const, label: "Privacy" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();

  const completion = calcCompletion(profile);
  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "?";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  const soon = () => Alert.alert("Coming soon", "This feature is on its way.");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={soon}>
            <Ionicons name="git-network-outline" size={19} color={Colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Profile</Text>
          <Pressable style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={soon}>
            <Ionicons name="settings-outline" size={19} color={Colors.text} />
          </Pressable>
        </View>

        {/* Avatar + completion ring */}
        <View style={styles.avatarSection}>
          <View style={styles.ringWrap}>
            <View style={styles.ring} />
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <View style={styles.completionPill}>
            <Text style={styles.completionText}>{completion}%</Text>
          </View>
          <Text style={styles.profileName}>
            {profile ? `${profile.first_name} ${profile.last_name}` : "—"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email ?? "—"}</Text>
        </View>

        {/* 2x2 quick action grid */}
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={({ pressed }) => [styles.gridCell, { opacity: pressed ? 0.75 : 1 }]}
              onPress={soon}
            >
              <View style={styles.gridIconWrap}>
                <Ionicons name={a.icon} size={22} color={Colors.steel} />
              </View>
              <Text style={styles.gridLabel}>{a.label}</Text>
              <Text style={styles.gridSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* Settings rows */}
        <View style={styles.card}>
          {SETTINGS.map((row, i) => (
            <Pressable
              key={row.label}
              style={({ pressed }) => [
                styles.row,
                i < SETTINGS.length - 1 && styles.rowDivider,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={soon}
            >
              <View style={styles.rowIconWrap}>
                <Ionicons name={row.icon} size={17} color={Colors.textMuted} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.textDim} />
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutRow, { opacity: pressed ? 0.75 : 1 }]}
          onPress={handleSignOut}
        >
          <View style={[styles.rowIconWrap, styles.signOutIcon]}>
            <Ionicons name="log-out-outline" size={17} color="#E05252" />
          </View>
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Porter · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  scroll: { paddingHorizontal: 20 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 32,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    letterSpacing: 0.2,
  },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 32 },
  ringWrap: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.cardElev,
    borderWidth: 0.5,
    borderColor: Colors.cardElevBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: Fonts.serifBold,
    color: Colors.text,
  },
  completionPill: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: -8,
    marginBottom: 16,
    zIndex: 1,
  },
  completionText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.bgDeep,
  },
  profileName: {
    fontSize: 26,
    fontFamily: Fonts.serifBold,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // Quick action grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  gridCell: {
    width: "47%",
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 8,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  gridSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // Card + rows
  card: {
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.xl,
    marginBottom: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.buttonSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },

  // Sign out
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.xl,
    marginBottom: 24,
  },
  signOutIcon: { backgroundColor: "rgba(224,82,82,0.1)" },
  signOutLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: "#E05252",
  },

  version: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    textAlign: "center",
  },
});
