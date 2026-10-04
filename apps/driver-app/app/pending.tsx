import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Eyebrow, GradientScreen } from "@/components/ui";

/** Shown to anyone signed in who isn't an approved, active porter. */
export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [user?.id]),
  );

  const check = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  let icon: keyof typeof Ionicons.glyphMap = "time-outline";
  let title = "We're reviewing your account";
  let body =
    "Thanks for signing up. Porter will verify your details and approve your account. You can start taking jobs as soon as you're approved.";
  let canRecheck = true;

  if (profile?.user_type !== "porter") {
    icon = "person-circle-outline";
    title = "This is a customer account";
    body = `${user?.email ?? "This email"} is set up for the Porter customer app. Use a different email to drive with Porter.`;
    canRecheck = false;
  } else if (profile.verification_status === "rejected") {
    icon = "close-circle-outline";
    title = "Your application wasn't approved";
    body = "Contact Porter support if you think this is a mistake.";
    canRecheck = false;
  } else if (profile.is_active === false) {
    icon = "pause-circle-outline";
    title = "Your account is paused";
    body = "Contact Porter support to reactivate your account.";
  }

  return (
    <GradientScreen>
      <View style={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={44} color={Colors.steel} />
        </View>
        <View style={{ gap: 10 }}>
          <Eyebrow>{profile?.first_name ? `Hi ${profile.first_name}` : "Porter Driver"}</Eyebrow>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>

        {profile?.user_type === "porter" && (
          <Card style={{ gap: 6 }}>
            <Text style={styles.cardLabel}>Signed up as</Text>
            <Text style={styles.cardValue}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={styles.cardSub}>{user?.email}</Text>
          </Card>
        )}

        <View style={{ flex: 1 }} />
        {canRecheck && <Button label="Check again" icon="refresh" onPress={check} loading={checking} />}
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, gap: 24 },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.cardElev, borderWidth: 1, borderColor: Colors.cardElevBorder,
  },
  heading: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 28, lineHeight: 34 },
  body: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  cardLabel: { color: Colors.textDim, fontFamily: Fonts.medium, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  cardValue: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 17 },
  cardSub: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14 },
});
