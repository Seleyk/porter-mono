import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceRequest } from "@porter/shared";
import { Colors, Fonts } from "@/constants/theme";
import { useOnline } from "@/context/OnlineContext";
import { acceptJob, fetchJob } from "@/services/jobs";
import { fetchRoute } from "@/services/routes";
import { JobMap } from "@/components/JobMap";
import { Stops } from "@/components/JobCard";
import { Button, Card, Eyebrow } from "@/components/ui";
import { dropoffOf, formatMiles, itemSummary, milesBetween, money, pickupOf } from "@/lib/format";

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coords } = useOnline();
  const [job, setJob] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<{ coords: [number, number][]; miles: number; minutes: number } | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchJob(id)
      .then((j) => {
        setJob(j);
        if (j) {
          fetchRoute(pickupOf(j), dropoffOf(j)).then((r) =>
            setRoute({ coords: r.coords, miles: r.distanceMiles, minutes: r.durationMinutes }),
          );
        }
      })
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  const accept = async () => {
    if (!job) return;
    setAccepting(true);
    try {
      await acceptJob(job.id);
      router.replace("/active");
    } catch (e: any) {
      Alert.alert("Couldn't accept this job", e.message ?? "Please try again.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.steel} />
      </View>
    );
  }

  const available = job && job.status === "pending" && !job.porter_id;
  const toPickup = job && coords ? milesBetween(coords, { lat: job.pickup_latitude, lng: job.pickup_longitude }) : null;

  return (
    <View style={styles.container}>
      <JobMap
        style={styles.map}
        pins={job ? [
          { id: "pickup", coord: pickupOf(job), kind: "pickup" },
          { id: "dropoff", coord: dropoffOf(job), kind: "dropoff" },
        ] : []}
        route={route?.coords}
        fit={job ? [pickupOf(job), dropoffOf(job)] : undefined}
      />
      <Pressable style={[styles.close, { top: insets.top + 8 }]} onPress={() => router.back()}>
        <Ionicons name="close" size={20} color={Colors.text} />
      </Pressable>

      <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        {!job || !available ? (
          <Card style={{ gap: 10, alignItems: "center", paddingVertical: 28 }}>
            <Ionicons name="alert-circle-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.title}>This job is no longer available</Text>
            <Button label="Back to jobs" variant="secondary" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
          </Card>
        ) : (
          <>
            <View style={styles.rowBetween}>
              <View style={{ gap: 4 }}>
                <Eyebrow>{itemSummary(job)}</Eyebrow>
                <Text style={styles.price}>{money(job.total_price ?? job.base_price)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 2 }}>
                {toPickup !== null && <Text style={styles.stat}>{formatMiles(toPickup)} to pickup</Text>}
                {route && route.miles > 0 && (
                  <Text style={styles.muted}>
                    {route.miles.toFixed(1)} mi · {Math.round(route.minutes)} min trip
                  </Text>
                )}
              </View>
            </View>

            <Card>
              <Stops job={job} />
            </Card>

            {job.special_instructions ? (
              <Card style={{ gap: 6 }}>
                <Text style={styles.label}>Customer note</Text>
                <Text style={styles.body}>{job.special_instructions}</Text>
              </Card>
            ) : null}

            <Button label="Accept job" icon="checkmark" onPress={accept} loading={accepting} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  center: { alignItems: "center", justifyContent: "center" },
  map: { height: 300 },
  close: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,11,22,0.8)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sheet: { padding: 20, gap: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  price: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 30 },
  stat: { color: Colors.steel, fontFamily: Fonts.semibold, fontSize: 14 },
  title: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 17, textAlign: "center" },
  label: { color: Colors.textDim, fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  body: { color: Colors.text, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  muted: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 13 },
});
