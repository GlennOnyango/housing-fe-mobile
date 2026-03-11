import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function TenantInvoiceListScreen() {
  const invoicesQuery = useQuery({
    queryKey: ["tenant", "invoices", "all"],
    queryFn: () => tenantApi.listInvoices({ page: 1, pageSize: 25 }),
  });

  return (
    <Screen>
      <Text style={styles.title}>Invoices</Text>
      {invoicesQuery.isLoading ? <Text>Loading invoices...</Text> : null}
      {invoicesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(invoicesQuery.error))}</Text>
      ) : null}

      {(invoicesQuery.data?.items ?? []).map((invoice) => (
        <SectionCard key={invoice.id} title={`Invoice ${invoice.id}`} subtitle={invoice.status}>
          <Text>Amount due: {invoice.amountDue}</Text>
          <Text>Due date: {invoice.dueDate}</Text>
          <Link href={`/tenant/invoices/${invoice.id}` as const} style={styles.link}>
            Open invoice detail
          </Link>
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
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  error: {
    color: "#b91c1c",
  },
});
