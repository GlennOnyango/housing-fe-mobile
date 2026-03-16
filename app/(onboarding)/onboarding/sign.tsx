import { useEffect, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { onboardingApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SensitiveScreen } from "@/src/security/sensitive-screen";

export default function OnboardingSignScreen() {
  const { signInWithTokens } = useSession();
  const params = useLocalSearchParams<{
    inviteToken?: string;
    inviteId?: string;
    orgId?: string;
    leaseId?: string;
    userId?: string;
    unitId?: string;
    houseUnitId?: string;
    unitLabel?: string;
  }>();
  const [leaseId, setLeaseId] = useState(params.leaseId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inviteToken = params.inviteToken;
  const unitDisplay = params.unitLabel?.trim() || params.unitId?.trim() || "Not available";

  useEffect(() => {
    if (params.leaseId) {
      setLeaseId(params.leaseId);
    }
  }, [params.leaseId]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!inviteToken) {
        throw new Error("Missing invite token.");
      }

      if (!leaseId.trim()) {
        throw new Error("Lease ID is required.");
      }
      if (!hasLeasePreview) {
        throw new Error("Review the lease preview before accepting.");
      }

      const result = await onboardingApi.acceptLease(inviteToken, {
        leaseId: leaseId.trim(),
      });
      await signInWithTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    },
    onSuccess: () => {
      setError(null);
      setMessage("Lease accepted. Redirecting to tenant dashboard...");
      router.replace("/tenant");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("onboarding.accept-lease", mutationError));
    },
  });

  const leasePreviewQuery = useQuery({
    queryKey: [
      "onboarding",
      "lease-preview",
      inviteToken,
      leaseId,
      params.userId,
    ],
    queryFn: async () => {
      if (!inviteToken) {
        throw new Error("Missing invite token.");
      }
      if (!leaseId.trim() || !params.userId?.trim()) {
        throw new Error("Missing leaseId/userId required to fetch lease preview.");
      }
      return onboardingApi.getLeasePreview(inviteToken, {
        leaseId: leaseId.trim(),
        userId: params.userId.trim(),
      });
    },
    enabled: Boolean(inviteToken && leaseId.trim() && params.userId?.trim()),
    retry: false,
  });

  const hasLeasePreview =
    Boolean(leasePreviewQuery.data?.previewUrl);

  return (
    <SensitiveScreen>
      <Screen scrollable={false}>
        <View style={styles.content}>
        <Text style={styles.title}>Accept lease</Text>
        <Text style={styles.copy}>Unit: {unitDisplay}</Text>
        <Text style={styles.copy}>
          Review your lease and accept to continue onboarding.
        </Text>
        <LabeledInput label="Lease ID" value={leaseId} onChangeText={setLeaseId} />
        <Text style={styles.sectionTitle}>Lease preview</Text>
        {leasePreviewQuery.isPending ? (
          <Text style={styles.copy}>Loading lease preview...</Text>
        ) : null}
        {leasePreviewQuery.data?.previewUrl ? (
          <View style={styles.leasePreviewWrap}>
            <WebView source={{ uri: leasePreviewQuery.data.previewUrl }} />
          </View>
        ) : null}
        {leasePreviewQuery.isError ? (
          <Text style={styles.error}>
            {messageFromLoggedApiError("onboarding.lease-preview", leasePreviewQuery.error)}
          </Text>
        ) : null}
        {!leasePreviewQuery.isPending &&
        !leasePreviewQuery.isError &&
        !leasePreviewQuery.data?.previewUrl ? (
          <Text style={styles.copy}>No lease content available to preview yet.</Text>
        ) : null}

        <View style={styles.bottomActions}>
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <CooldownText cooldownKey="onboarding.accept-lease" />

        <PrimaryButton
          onPress={() => acceptMutation.mutate()}
          loading={acceptMutation.isPending}
          disabled={!leaseId.trim() || !hasLeasePreview || leasePreviewQuery.isPending}
        >
          Accept lease
        </PrimaryButton>
        </View>
        </View>
      </Screen>
    </SensitiveScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  leasePreviewWrap: {
    flex: 1,
    minHeight: 380,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  bottomActions: {
    marginTop: "auto",
    gap: 10,
    paddingTop: 6,
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
});
