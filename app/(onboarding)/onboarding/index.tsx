import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { env } from "@/src/config/env";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function OnboardingEntryScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  return (
    <Screen>
      <Text style={styles.title}>Tenant onboarding</Text>
      <Text style={styles.copy}>
        Deep-link target: `{env.APP_SCHEME}://onboarding?token=...`
      </Text>
      <Text style={styles.copy}>No sign-in is required for this onboarding flow.</Text>
      <SectionCard title="Flow">
        <Text>1. Claim invite token</Text>
        <Text>2. Complete profile with `x-invite-token`</Text>
        <Text>3. Upload signature and sign lease</Text>
      </SectionCard>
      <PrimaryButton
        onPress={() =>
          router.push({
            pathname: "/onboarding/claim",
            params: token ? { token } : undefined,
          })
        }
      >
        Start claim
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
});
