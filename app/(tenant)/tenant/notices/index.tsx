import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function TenantNoticesScreen() {
  const noticesQuery = useQuery({
    queryKey: ["tenant", "notices", "all"],
    queryFn: () => tenantApi.listNotices({ page: 1, pageSize: 30 }),
  });

  return (
    <Screen>
      <Text style={styles.title}>Notices</Text>
      {noticesQuery.isLoading ? <Text>Loading notices...</Text> : null}
      {noticesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(noticesQuery.error))}</Text>
      ) : null}

      {(noticesQuery.data?.items ?? []).map((notice) => (
        <SectionCard key={notice.id} title={notice.title} subtitle={notice.createdAt}>
          <Text>{notice.body}</Text>
        </SectionCard>
      ))}
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
