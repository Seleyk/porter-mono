import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import MapboxGL from "@rnmapbox/maps";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Colors } from "@/constants/theme";
import { StripeProvider } from "@stripe/stripe-react-native";

SplashScreen.preventAutoHideAsync();

const AUTH_SCREENS = new Set(["index", "welcome", "auth", "otp", "permissions"]);

function RouteGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    const inAuthFlow = !first || AUTH_SCREENS.has(first);
    const inSetup = first === "setup-profile";

    if (!session && !inAuthFlow) {
      router.replace("/welcome");
    } else if (session && !profile && !inSetup) {
      router.replace("/setup-profile");
    } else if (session && profile && (inAuthFlow || inSetup)) {
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
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.porter.customer"
    >
      <AuthProvider>
        <RouteGuard>
        <View style={{ flex: 1, backgroundColor: Colors.bgDeep }} onLayout={onLayoutRootView}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: "default" }}>
            {/* Onboarding — fade for cinematic feel */}
            <Stack.Screen name="index" options={{ animation: "fade" }} />
            <Stack.Screen name="welcome" options={{ animation: "fade" }} />
            <Stack.Screen name="auth" options={{ animation: "fade" }} />
            <Stack.Screen name="otp" options={{ animation: "fade" }} />
            <Stack.Screen name="permissions" options={{ animation: "fade" }} />
            <Stack.Screen name="setup-profile" options={{ animation: "fade" }} />
            {/* Main app */}
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            {/* Booking flow — slide via default */}
            <Stack.Screen name="where-to" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="select-type" />
            <Stack.Screen name="port-details" />
            <Stack.Screen name="dropoff-method" />
            <Stack.Screen name="delivery-method" />
            <Stack.Screen name="finding-porter" options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="proof-of-delivery" />
            <Stack.Screen name="complete" options={{ animation: "fade_from_bottom" }} />
            {/* Porter Box */}
            <Stack.Screen name="porter-box-hub" />
            <Stack.Screen name="porter-box-handoff" />
            <Stack.Screen name="porter-box-pickup" />
            <Stack.Screen name="porter-box-collected" options={{ animation: "fade_from_bottom" }} />
          </Stack>
        </View>
        </RouteGuard>
      </AuthProvider>
    </StripeProvider>
  );
}
