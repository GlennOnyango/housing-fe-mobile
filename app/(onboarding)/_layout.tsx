import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="onboarding/index" options={{ title: "Tenant onboarding" }} />
      <Stack.Screen name="onboarding/claim" options={{ title: "Claim invite" }} />
      <Stack.Screen name="onboarding/profile" options={{ title: "Complete profile" }} />
      <Stack.Screen name="onboarding/sign" options={{ title: "Accept lease" }} />
    </Stack>
  );
}
