import { useEffect } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useOnline } from "@/context/OnlineContext";
import { useActiveJob, useNearbyJobs } from "@/hooks/useJobs";
import { JobMap, type MapPin } from "@/components/JobMap";
import { JobCard, Stops } from "@/components/JobCard";
import { Button, Card, Eyebrow, StatusPill } from "@/components/ui";
import { money, pickupOf, earnings } from "@/lib/format";

export default function DriveScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { online, coords, goOnline, goOffline, setTracking } = useOnline();
  const { job: activeJob, loading: activeLoading } = useActiveJob();

  // Keep sharing location with the customer while a job is in progress.
  useEffect(() => {
    if (!activeLoading) setTracking(!!activeJob);
  }, [!!activeJob, activeLoading]);
  const showingJobs = online && !activeJob;
  const { jobs, loading, error, refresh } = useNearbyJobs(showingJobs, coords);

  const pins: MapPin[] = activeJob
    ? [{ id: activeJob.id, coord: pickupOf(activeJob), kind: "pickup" }]
    : jobs.map((j) => ({ id: j.id, coord: pickupOf(j), kind: "job", onPress: () => router.push(`/job/${j.id}`) }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={{ gap: 4 }}>
          <Eyebrow>{profile ? `Hi ${profile.first_name}` : "Porter Driver"}</Eyebrow>
          <StatusPill label={online ? "Online" : "Offline"} color={online ? Colors.evergreen : Colors.textDim} />
        </View>
        <Pressable
          onPress={online ? goOffline : goOnline}
          style={({ pressed }) => [styles.toggle, online && styles.toggleOn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="power" size={18} color={Colors.text} />
          <Text style={styles.toggleText}>{online ? "Go offline" : "Go online"}</Text>
        </Pressable>
      </View>

      <JobMap
        style={styles.map}
        pins={pins}
        center={coords ? [coords.lng, coords.lat] : null}
        showPuck={online || !!activeJob}
      />

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          showingJobs ? <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.steel} /> : undefined
        }
      >
        {activeJob ? (
          <Card style={{ gap: 14 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>
                {activeJob.status === "picked_up" ? "Delivering now" : "Heading to pickup"}
              </Text>
              <Text style={styles.price}>{money(earnings(activeJob))}</Text>
            </View>
            <Stops job={activeJob} />
            <Button label="Continue job" icon="chevron-forward" onPress={() => router.push("/active")} />
          </Card>
        ) : !online ? (
          <Card style={{ gap: 10, alignItems: "center", paddingVertical: 28 }}>
            <Ionicons name="moon-outline" size={30} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>You're offline</Text>
            <Text style={styles.muted}>Go online to see jobs near you.</Text>
          </Card>
        ) : (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Nearby jobs</Text>
              {loading && <ActivityIndicator color={Colors.steel} />}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            {!coords ? (
              <Text style={styles.muted}>Finding your location…</Text>
            ) : jobs.length === 0 && !loading ? (
              <Card style={{ gap: 8, alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="hourglass-outline" size={26} color={Colors.textMuted} />
                <Text style={styles.muted}>No open jobs within 15 km right now. New jobs show up here automatically.</Text>
              </Card>
            ) : (
              jobs.map((j) => (
                <JobCard key={j.id} job={j} from={coords} onPress={() => router.push(`/job/${j.id}`)} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.midnight,
    borderWidth: 1,
    borderColor: Colors.cardElevBorder,
  },
  toggleOn: { backgroundColor: "rgba(78,111,100,0.35)", borderColor: Colors.evergreen },
  toggleText: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 14 },
  map: { height: 240, marginHorizontal: 20, borderRadius: Radius.xl },
  list: { padding: 20, gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 17 },
  price: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 18 },
  muted: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14, textAlign: "center", lineHeight: 20 },
  error: { color: "#E58A8A", fontFamily: Fonts.medium, fontSize: 13 },
});
