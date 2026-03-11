import { Stack } from "expo-router";

import { AppProviders } from "@/src/providers/app-providers";
import { AppLockOverlay } from "@/src/security/app-lock-context";

export default function RootLayout() {
  return (
    <AppProviders>
      <AppLockOverlay />
      <Stack screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
        <Stack.Screen name="(tenant)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProviders>
  );
}
