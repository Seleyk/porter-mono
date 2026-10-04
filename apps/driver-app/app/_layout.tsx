import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import MapboxGL from "@rnmapbox/maps";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OnlineProvider } from "@/context/OnlineContext";
import { Colors } from "@/constants/theme";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");
SplashScreen.preventAutoHideAsync();

const SIGNED_OUT_SCREENS = new Set(["welcome", "otp"]);

/**
 * Sends each user to the one place they can be:
 * signed out → welcome, no profile → setup, not an approved porter → pending,
 * approved porter → the app.
 */
function RouteGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    const approved =
      profile?.user_type === "porter" && profile.verification_status === "approved" && profile.is_active !== false;

    if (!session) {
      if (!first || !SIGNED_OUT_SCREENS.has(first)) router.replace("/welcome");
    } else if (!profile) {
      if (first !== "setup-profile") router.replace("/setup-profile");
    } else if (!approved) {
      if (first !== "pending") router.replace("/pending");
    } else if (!first || SIGNED_OUT_SCREENS.has(first) || first === "setup-profile" || first === "pending") {
      router.replace("/(tabs)");
    }
  }, [session, profile, loading, segments]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Manrope_300Light,
      Manrope_400Regular,
      Manrope_500Medium,
      Manrope_600SemiBold,
      Manrope_700Bold,
      Manrope_800ExtraBold,
    }).then(() => setFontsLoaded(true));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <OnlineProvider>
        <RouteGuard>
          <View style={{ flex: 1, backgroundColor: Colors.bgDeep }} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "default" }}>
              <Stack.Screen name="index" options={{ animation: "fade" }} />
              <Stack.Screen name="welcome" options={{ animation: "fade" }} />
              <Stack.Screen name="otp" options={{ animation: "fade" }} />
              <Stack.Screen name="setup-profile" options={{ animation: "fade" }} />
              <Stack.Screen name="pending" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen name="job/[id]" options={{ animation: "slide_from_bottom" }} />
              <Stack.Screen name="active" options={{ animation: "fade", gestureEnabled: false }} />
            </Stack>
          </View>
        </RouteGuard>
      </OnlineProvider>
    </AuthProvider>
  );
}
