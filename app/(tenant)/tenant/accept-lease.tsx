import { useEffect } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { messageFromLoggedApiError, normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { CooldownText } from "@/src/components/cooldown-text";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

export default function TenantAcceptLeaseScreen() {
  const { signInWithTokens } = useSession();

  const pendingLeaseQuery = useQuery({
    queryKey: ["tenant", "leases", "pending-acceptance"],
    queryFn: () => tenantApi.getPendingLeaseAcceptance(),
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const leaseId = pendingLeaseQuery.data?.lease?.id;
      if (!leaseId) {
        throw new Error("No pending lease to accept.");
      }

      const result = await tenantApi.acceptPendingLease(leaseId);
      await signInWithTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    },
    onSuccess: () => {
      router.replace("/tenant");
    },
    onError: () => {
      // handled by UI error renderer
    },
  });

  useEffect(() => {
    if (
      pendingLeaseQuery.isSuccess &&
      (!pendingLeaseQuery.data?.hasPendingLease || !pendingLeaseQuery.data.lease)
    ) {
      router.replace("/tenant");
    }
  }, [pendingLeaseQuery.data, pendingLeaseQuery.isSuccess]);

  if (pendingLeaseQuery.isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Accept Lease" }} />
        <Text style={styles.copy}>Checking pending lease...</Text>
      </Screen>
    );
  }

  if (pendingLeaseQuery.isError) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Accept Lease" }} />
        <Text style={styles.error}>{problemToMessage(normalizeApiError(pendingLeaseQuery.error))}</Text>
      </Screen>
    );
  }

  if (!pendingLeaseQuery.data?.hasPendingLease || !pendingLeaseQuery.data.lease) {
    return null;
  }

  const lease = pendingLeaseQuery.data.lease;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Accept Lease" }} />
      <Text style={styles.title}>Pending lease acceptance</Text>
      <Text style={styles.copy}>Review and accept your pending lease to continue.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lease {lease.id}</Text>
        <Text style={styles.cardCopy}>Status: {lease.status}</Text>
        <Text style={styles.cardCopy}>Start: {lease.startDate}</Text>
        <Text style={styles.cardCopy}>End: {lease.endDate ?? "N/A"}</Text>
        <Text style={styles.cardCopy}>Unit ID: {lease.houseUnitId}</Text>
      </View>

      {acceptMutation.isError ? (
        <Text style={styles.error}>
          {messageFromLoggedApiError("tenant.accept-lease", acceptMutation.error)}
        </Text>
      ) : null}
      <CooldownText cooldownKey="tenant.accept-lease" />

      <PrimaryButton onPress={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
        Accept lease
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
  error: {
    color: "#b91c1c",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardCopy: {
    color: "#334155",
  },
});
