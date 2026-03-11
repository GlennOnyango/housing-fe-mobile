import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function UnitInvitesScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();

  const invitesQuery = useQuery({
    queryKey: ["owner", "unit-invites", unitId],
    enabled: Boolean(unitId),
    queryFn: () => ownerApi.listUnitInvites(unitId, { page: 1, pageSize: 100 }),
  });

  return (
    <Screen>
      <Text style={styles.title}>Invited Tenants</Text>
      {invitesQuery.isLoading ? <Text>Loading invites...</Text> : null}
      {invitesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(invitesQuery.error))}</Text>
      ) : null}

      {(invitesQuery.data?.items ?? []).map((invite) => (
        <SectionCard
          key={invite.id }
          title={invite.tenantEmail ?? invite.tenantPhone ?? "Invite"}
          subtitle={invite.consumedAt ?? "Pending"}
        >
          {invite.tenantEmail ? <Text style={styles.meta}>Email: {invite.tenantEmail}</Text> : null}
          {invite.tenantPhone ? <Text style={styles.meta}>Phone: {invite.tenantPhone}</Text> : null}
          <Text style={styles.meta}>Invite ID: {invite.id ?? "-"}</Text>
          <Text style={styles.meta}>Created: {invite.createdAt ?? "-"}</Text>
        </SectionCard>
      ))}

      {!invitesQuery.isLoading && !(invitesQuery.data?.items ?? []).length ? (
        <Text style={styles.meta}>No invites found for this unit.</Text>
      ) : null}
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
  meta: {
    color: "#475569",
  },
});
