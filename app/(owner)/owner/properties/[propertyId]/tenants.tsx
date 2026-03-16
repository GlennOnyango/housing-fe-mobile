import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";

interface ActiveTenantCard {
  id: string;
  unitLabel: string;
  tenantEmail: string;
  tenantPhone: string;
  claimedAt?: string | null;
  consumedAt?: string | null;
}

export default function PropertyTenantsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  const activeTenantsQuery = useQuery({
    queryKey: ["owner", "property-active-tenants", propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      const units = await ownerApi.listUnits(propertyId, { page: 1, pageSize: 100 });

      const inviteRows = await Promise.all(
        units.items.map(async (unit) => {
          const invites = await ownerApi.listUnitInvites(unit.id, { page: 1, pageSize: 100 });
          return invites.items.map(
            (invite) =>
              ({
                id: invite.id,
                unitLabel: unit.unitLabel,
                tenantEmail: invite.tenantEmail ?? "N/A",
                tenantPhone: invite.tenantPhone ?? "N/A",
                claimedAt: invite.claimedAt,
                consumedAt: invite.consumedAt,
              }) satisfies ActiveTenantCard,
          );
        }),
      );

      return inviteRows
        .flat()
        .filter((item) => Boolean(item.claimedAt || item.consumedAt));
    },
  });

  const cards = useMemo(() => activeTenantsQuery.data ?? [], [activeTenantsQuery.data]);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Active Tenants" }} />
      <Text style={styles.title}>Active tenants</Text>
      <Text style={styles.copy}>Property ID: {propertyId}</Text>

      {activeTenantsQuery.isLoading ? <Text style={styles.copy}>Loading tenants...</Text> : null}
      {activeTenantsQuery.isError ? (
        <Text style={styles.error}>
          {problemToMessage(normalizeApiError(activeTenantsQuery.error))}
        </Text>
      ) : null}

      {!activeTenantsQuery.isLoading && !cards.length ? (
        <Text style={styles.copy}>No active tenants found for this property.</Text>
      ) : null}

      <View style={styles.list}>
        {cards.map((tenant) => (
          <View key={tenant.id} style={styles.card}>
            <Text style={styles.cardTitle}>{tenant.tenantEmail}</Text>
            <Text style={styles.cardCopy}>Phone: {tenant.tenantPhone}</Text>
            <Text style={styles.cardCopy}>Unit: {tenant.unitLabel}</Text>
            <Text style={styles.cardCopy}>
              Active since: {tenant.consumedAt ?? tenant.claimedAt ?? "N/A"}
            </Text>
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
