import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useOnline } from "@/context/OnlineContext";
import { Button, Card, Eyebrow, StatusPill } from "@/components/ui";
import { getPayoutStatus, payoutDashboardUrl, payoutSetupUrl, type PayoutStatus } from "@/services/payouts";

const PAYOUT_COPY: Record<PayoutStatus["state"], { pill: string; color: string; text: string }> = {
  not_started: {
    pill: "Not set up",
    color: Colors.gold,
    text: "Add your bank details with Stripe to get paid. Jobs you finish before then are paid once you're set up.",
  },
  incomplete: {
    pill: "Unfinished",
    color: Colors.gold,
    text: "Stripe still needs a few details before it can pay you.",
  },
  pending: {
    pill: "Being verified",
    color: Colors.steel,
    text: "Stripe is checking your details. This usually takes a few minutes, sometimes a day.",
  },
  enabled: {
    pill: "Active",
    color: Colors.evergreen,
    text: "Your share of each job is sent to Stripe when you complete it, and tips go to you in full. Stripe pays out to your bank on its regular schedule.",
  },
};

function PayoutsCard() {
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const refresh = useCallback(() => {
    getPayoutStatus()
      .then((s) => {
        setStatus(s);
        setError(null);
        if (s.paidNow) Alert.alert("Earnings sent", `We've sent your earnings for ${s.paidNow} earlier payment${s.paidNow === 1 ? "" : "s"} to Stripe.`);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Refresh when the tab opens and when the porter comes back from Stripe.
  useFocusEffect(refresh);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => state === "active" && refresh());
    return () => sub.remove();
  }, [refresh]);

  const open = async (getUrl: () => Promise<string>) => {
    setOpening(true);
    try {
      await Linking.openURL(await getUrl());
    } catch (e: any) {
      Alert.alert("Couldn't open Stripe", e.message ?? "Please try again.");
    } finally {
      setOpening(false);
    }
  };

  const copy = status ? PAYOUT_COPY[status.state] : null;

  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.payoutHeader}>
        <Eyebrow>Payouts</Eyebrow>
        {copy && <StatusPill label={copy.pill} color={copy.color} />}
      </View>
      <Text style={styles.payoutText}>{error ?? copy?.text ?? "Checking your payout account…"}</Text>
      {status && status.state !== "enabled" && status.state !== "pending" && (
        <Button
          label={status.state === "not_started" ? "Set up payouts" : "Finish setting up"}
          loading={opening}
          onPress={() => open(payoutSetupUrl)}
        />
      )}
      {status && (status.state === "enabled" || status.state === "pending") && (
        <Button label="View earnings in Stripe" variant="secondary" loading={opening} onPress={() => open(payoutDashboardUrl)} />
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();
  const { goOffline } = useOnline();

  const initials = profile ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase() : "?";
  const vehicle = [profile?.vehicle_color, profile?.vehicle_make, profile?.vehicle_model].filter(Boolean).join(" ");

  const handleSignOut = () =>
    Alert.alert("Sign out", "You'll go offline and stop receiving jobs.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await goOffline();
          await signOut();
        },
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: Colors.bgDeep }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <StatusPill label="Approved porter" color={Colors.evergreen} />
      </View>

      <PayoutsCard />

      <Card style={{ gap: 4 }}>
        <Eyebrow>Contact</Eyebrow>
        <Row label="Phone" value={profile?.phone} />
        <Row label="Email" value={user?.email} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Eyebrow>Vehicle</Eyebrow>
        <Row label="Vehicle" value={vehicle} />
        <Row label="Plate" value={profile?.license_plate} />
      </Card>

      <Text style={styles.note}>To change your details, contact Porter support.</Text>

      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { alignItems: "center", gap: 8, marginBottom: 8 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.midnight, borderWidth: 1, borderColor: Colors.cardElevBorder,
  },
  initials: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 28 },
  name: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 22 },
  email: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 15 },
  rowValue: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 15 },
  payoutHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payoutText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  note: { color: Colors.textDim, fontFamily: Fonts.regular, fontSize: 12, textAlign: "center" },
});
