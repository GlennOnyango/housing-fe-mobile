import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";

export default function TenantLeaseHistoryScreen() {
  const historyQuery = useQuery({
    queryKey: ["tenant", "leases", "history"],
    queryFn: () => tenantApi.getLeaseHistory({ page: 1, pageSize: 50 }),
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Lease History" }} />
      <Text style={styles.title}>Lease history</Text>

      {historyQuery.isLoading ? <Text style={styles.copy}>Loading lease history...</Text> : null}
      {historyQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(historyQuery.error))}</Text>
      ) : null}

      {!historyQuery.isLoading && !historyQuery.isError && !(historyQuery.data?.items.length ?? 0) ? (
        <Text style={styles.copy}>No lease history available.</Text>
      ) : null}

      <View style={styles.list}>
        {(historyQuery.data?.items ?? []).map((lease) => (
          <View key={lease.id} style={styles.card}>
            <Text style={styles.cardTitle}>Lease {lease.id}</Text>
            <Text style={styles.cardCopy}>Status: {lease.status}</Text>
            <Text style={styles.cardCopy}>Start: {lease.startDate}</Text>
            <Text style={styles.cardCopy}>End: {lease.endDate ?? "N/A"}</Text>
            <Text style={styles.cardCopy}>Signed: {lease.signedAt ?? "Not signed"}</Text>
            <Text style={styles.cardCopy}>Unit ID: {lease.houseUnitId}</Text>
          </View>
        ))}
      </View>
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
  list: {
    gap: 10,
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
