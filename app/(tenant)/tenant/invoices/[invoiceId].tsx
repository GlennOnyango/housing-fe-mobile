import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { SensitiveScreen } from "@/src/security/sensitive-screen";

export default function TenantInvoiceDetailScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();

  const invoiceQuery = useQuery({
    queryKey: ["tenant", "invoice", invoiceId],
    enabled: Boolean(invoiceId),
    queryFn: () => tenantApi.getInvoice(invoiceId),
  });

  return (
    <SensitiveScreen>
      <Screen>
        <Text style={styles.title}>Invoice detail</Text>
        {invoiceQuery.isLoading ? <Text>Loading invoice...</Text> : null}
        {invoiceQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(invoiceQuery.error))}</Text>
        ) : null}

        {invoiceQuery.data ? (
          <SectionCard title={`Invoice ${invoiceQuery.data.id}`} subtitle={invoiceQuery.data.status}>
            <Text>Amount due: {invoiceQuery.data.amountDue}</Text>
            <Text>Due date: {invoiceQuery.data.dueDate}</Text>
            <Text>Currency: {invoiceQuery.data.currency ?? "N/A"}</Text>
          </SectionCard>
        ) : null}
      </Screen>
    </SensitiveScreen>
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
