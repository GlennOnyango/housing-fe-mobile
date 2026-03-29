import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
          <View style={styles.stack}>
            <SectionCard title={`Invoice ${invoiceQuery.data.id}`} subtitle={invoiceQuery.data.status}>
              <Text>Total: {invoiceQuery.data.total}</Text>
              <Text>Period: {invoiceQuery.data.period}</Text>
              <Text>Unit: {invoiceQuery.data.houseUnitId}</Text>
              <Text>Created: {invoiceQuery.data.createdAt}</Text>
              <Text>Updated: {invoiceQuery.data.updatedAt}</Text>
            </SectionCard>

            <SectionCard title="Lines">
              {invoiceQuery.data.lines.length ? (
                invoiceQuery.data.lines.map((line) => (
                  <View key={line.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{line.type}</Text>
                    <Text style={styles.rowCopy}>Amount: {line.amount}</Text>
                    <Text style={styles.rowCopy}>Created: {line.createdAt}</Text>
                  </View>
                ))
              ) : (
                <Text>No invoice lines.</Text>
              )}
            </SectionCard>

            <SectionCard title="Payments">
              {invoiceQuery.data.payments.length ? (
                invoiceQuery.data.payments.map((payment) => (
                  <View key={payment.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{payment.provider}</Text>
                    <Text style={styles.rowCopy}>Amount: {payment.amount}</Text>
                    <Text style={styles.rowCopy}>Status: {payment.status}</Text>
                    <Text style={styles.rowCopy}>Reference: {payment.reference ?? "N/A"}</Text>
                  </View>
                ))
              ) : (
                <Text>No payments recorded.</Text>
              )}
            </SectionCard>
          </View>
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
  stack: {
    gap: 12,
  },
  row: {
    gap: 4,
  },
  rowTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  rowCopy: {
    color: "#334155",
  },
});
