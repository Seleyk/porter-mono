import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthProvider } from "@/context/AuthContext";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

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
      CormorantGaramond_400Regular,
      CormorantGaramond_400Regular_Italic,
      CormorantGaramond_500Medium_Italic,
      CormorantGaramond_600SemiBold_Italic,
      CormorantGaramond_700Bold,
    }).then(() => setFontsLoaded(true));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
    <View style={{ flex: 1, backgroundColor: Colors.bgDeep }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        {/* Onboarding */}
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="permissions" />
        {/* Main app */}
        <Stack.Screen name="(tabs)" />
        {/* Booking flow */}
        <Stack.Screen name="where-to" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="select-type" />
        <Stack.Screen name="port-details" />
        <Stack.Screen name="dropoff-method" />
        <Stack.Screen name="delivery-method" />
        <Stack.Screen name="finding-porter" />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="proof-of-delivery" />
        <Stack.Screen name="complete" />
        {/* Porter Box */}
        <Stack.Screen name="porter-box-hub" />
        <Stack.Screen name="porter-box-pickup" />
        <Stack.Screen name="porter-box-collected" />
      </Stack>
    </View>
    </AuthProvider>
  );
}
