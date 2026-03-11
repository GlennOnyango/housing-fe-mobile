import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { onboardingApi } from "@/src/api/services";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

export default function OnboardingClaimScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.token) {
      setToken(params.token);
    }
  }, [params.token]);

  const mutation = useMutation({
    mutationFn: async () => onboardingApi.claim({ token }),
    onSuccess: (result) => {
      setError(null);
      const inviteToken = token.trim();
      router.replace({
        pathname: "/onboarding/profile",
        params: {
          inviteToken,
          unitId: result.houseUnitId ?? undefined,
          orgId: result.orgId,
        },
      });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("onboarding.claim", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Claim invite</Text>
      <LabeledInput label="Invite token" value={token} onChangeText={setToken} autoCapitalize="none" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CooldownText cooldownKey="onboarding.claim" />
      <PrimaryButton
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        disabled={!token.trim()}
      >
        Claim
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
  error: {
    color: "#b91c1c",
  },
});
