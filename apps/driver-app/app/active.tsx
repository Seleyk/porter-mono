import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { Profile, ServiceRequest } from "@porter/shared";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useOnline } from "@/context/OnlineContext";
import { useActiveJob } from "@/hooks/useJobs";
import { markDelivered, markPickedUp, releaseJob, uploadProofPhoto } from "@/services/jobs";
import { fetchRoute } from "@/services/routes";
import { JobMap } from "@/components/JobMap";
import { JobDetailsCard, Stops } from "@/components/JobCard";
import { Button, Card, Eyebrow } from "@/components/ui";
import { callPhone, openDirections } from "@/lib/navigation";
import { dropoffOf, itemSummary, money, pickupOf, earnings } from "@/lib/format";

type Photo = { uri: string; mimeType: string };

export default function ActiveJobScreen() {
  const insets = useSafeAreaInsets();
  const { coords, setTracking } = useOnline();
  const { job, loading, refresh } = useActiveJob();
  const [completed, setCompleted] = useState<ServiceRequest | null>(null);
  const [customer, setCustomer] = useState<Pick<Profile, "first_name" | "phone"> | null>(null);
  const [route, setRoute] = useState<[number, number][] | undefined>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);

  // Share location with the customer for as long as a job is in progress.
  // (The Drive tab does the same, so leaving this screen doesn't stop it.)
  useEffect(() => {
    if (!loading) setTracking(!!job);
  }, [!!job, loading]);

  // The customer's name and phone (visible to the porter on their job).
  useEffect(() => {
    if (!job) return;
    supabase
      .from("profiles")
      .select("first_name, phone")
      .eq("id", job.customer_id)
      .maybeSingle()
      .then(({ data }) => setCustomer(data));
  }, [job?.customer_id]);

  const heading = job?.status === "picked_up" ? "dropoff" : "pickup";
  const target = job ? (heading === "pickup" ? pickupOf(job) : dropoffOf(job)) : null;

  // Route from the porter to the next stop (or pickup → drop-off before we have a fix).
  useEffect(() => {
    if (!job || !target) return;
    const origin: [number, number] = coords ? [coords.lng, coords.lat] : pickupOf(job);
    fetchRoute(origin, heading === "pickup" && !coords ? dropoffOf(job) : target).then((r) => setRoute(r.coords));
  }, [job?.id, job?.status, coords ? Math.round(coords.lat * 500) : 0, coords ? Math.round(coords.lng * 500) : 0]);

  const run = async (fn: () => Promise<unknown>, failTitle: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      Alert.alert(failTitle, e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmPickup = () =>
    Alert.alert("Confirm pickup", "Have you collected the customer's items?", [
      { text: "Not yet", style: "cancel" },
      { text: "Picked up", onPress: () => run(async () => { await markPickedUp(job!.id); await refresh(); }, "Couldn't update the job") },
    ]);

  const confirmRelease = () =>
    Alert.alert("Release this job?", "It goes back to the job board for another porter.", [
      { text: "Keep job", style: "cancel" },
      {
        text: "Release",
        style: "destructive",
        onPress: () =>
          run(async () => {
            await releaseJob(job!.id);
            router.replace("/(tabs)");
          }, "Couldn't release the job"),
      },
    ]);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera needed", "Allow camera access in Settings to take a proof-of-delivery photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPhoto({ uri: a.uri, mimeType: a.mimeType ?? "image/jpeg" });
    }
  };

  const completeDelivery = () =>
    run(async () => {
      if (!job || !photo) return;
      const path = await uploadProofPhoto(job.id, photo.uri, photo.mimeType);
      const done = await markDelivered(job.id, path);
      setCompleted(done);
    }, "Couldn't complete the delivery");

  if (completed) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, gap: 16 }]}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={40} color={Colors.text} />
        </View>
        <Eyebrow>Delivered</Eyebrow>
        <Text style={styles.doneTitle}>Nice work</Text>
        <Text style={styles.doneAmount}>{money(earnings(completed))}</Text>
        <Text style={styles.muted}>{completed.dropoff_address}</Text>
        <Button label="Back to jobs" onPress={() => router.replace("/(tabs)")} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.steel} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, gap: 14 }]}>
        <Ionicons name="alert-circle-outline" size={30} color={Colors.textMuted} />
        <Text style={styles.title}>No job in progress</Text>
        <Text style={styles.muted}>The customer may have cancelled it.</Text>
        <Button label="Back to jobs" onPress={() => router.replace("/(tabs)")} style={{ alignSelf: "stretch" }} />
      </View>
    );
  }

  const address = heading === "pickup" ? job.pickup_address : job.dropoff_address;
  const [lng, lat] = target!;

  return (
    <View style={styles.container}>
      <JobMap
        style={styles.map}
        pins={[
          { id: "pickup", coord: pickupOf(job), kind: "pickup" },
          { id: "dropoff", coord: dropoffOf(job), kind: "dropoff" },
        ]}
        route={route}
        fit={[...(coords ? [[coords.lng, coords.lat] as [number, number]] : []), target!]}
      />

      <ScrollView contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={{ gap: 6 }}>
          <Eyebrow>{heading === "pickup" ? "Step 1 · Pick up" : "Step 2 · Deliver"}</Eyebrow>
          <Text style={styles.address}>{address}</Text>
          <Text style={styles.meta}>{itemSummary(job)} · {money(earnings(job))}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button label="Navigate" icon="navigate" variant="secondary" onPress={() => openDirections(lat, lng, address)} style={{ flex: 1 }} />
          {customer?.phone ? (
            <Button label={`Call ${customer.first_name}`} icon="call" variant="secondary" onPress={() => callPhone(customer.phone!)} style={{ flex: 1 }} />
          ) : null}
        </View>

        <Card>
          <Stops job={job} />
        </Card>

        <JobDetailsCard job={job} />

        {job.status === "accepted" ? (
          <>
            <Button label="I've picked up the items" icon="cube" onPress={confirmPickup} loading={busy} />
            <Button label="Release job" variant="danger" onPress={confirmRelease} disabled={busy} />
          </>
        ) : (
          <>
            <Card style={{ gap: 12 }}>
              <Text style={styles.label}>Proof of delivery</Text>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              ) : (
                <Text style={styles.body}>Take a photo of the items at the drop-off before completing.</Text>
              )}
              <Button
                label={photo ? "Retake photo" : "Take photo"}
                icon="camera"
                variant="secondary"
                onPress={takePhoto}
                disabled={busy}
              />
            </Card>
            <Button label="Complete delivery" icon="checkmark" onPress={completeDelivery} disabled={!photo} loading={busy} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  center: { alignItems: "center", justifyContent: "center" },
  map: { height: 320 },
  sheet: { padding: 20, gap: 14 },
  address: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28 },
  actionsRow: { flexDirection: "row", gap: 10 },
  title: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 18 },
  label: { color: Colors.textDim, fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  body: { color: Colors.text, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14 },
  muted: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14, textAlign: "center" },
  photo: { width: "100%", height: 200, borderRadius: Radius.lg },
  doneIcon: {
    width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.evergreen,
  },
  doneTitle: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 30 },
  doneAmount: { color: Colors.gold, fontFamily: Fonts.bold, fontSize: 26 },
});
