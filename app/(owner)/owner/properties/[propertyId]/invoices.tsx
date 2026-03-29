import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { Screen } from "@/src/components/screen";

export default function PropertyInvoicesScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { session } = useSession();
  const [periodFilter, setPeriodFilter] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const unitsQuery = useQuery({
    queryKey: ["owner", "property-units", propertyId, "invoices-view"],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listUnits(propertyId, { page: 1, pageSize: 100 }),
  });

  const invoicesQuery = useQuery({
    queryKey: ["owner", "property-invoices", session.orgId, propertyId, periodFilter, selectedUnitId],
    enabled: Boolean(session.orgId && propertyId),
    queryFn: () =>
      ownerApi.listInvoices(session.orgId as string, {
        period: periodFilter.trim() || undefined,
        unitId: selectedUnitId || undefined,
      }),
  });

  const unitOptions = useMemo(
    () => [
      { label: "All units", value: "" },
      ...((unitsQuery.data?.items ?? []).map((unit) => ({
        label: unit.unitLabel,
        value: unit.id,
      })) as Array<{ label: string; value: string }>),
    ],
    [unitsQuery.data?.items],
  );

  const propertyUnitIds = useMemo(
    () => new Set((unitsQuery.data?.items ?? []).map((unit) => unit.id)),
    [unitsQuery.data?.items],
  );

  const visibleInvoices = useMemo(() => {
    const invoices = invoicesQuery.data ?? [];
    if (selectedUnitId) {
      return invoices;
    }

    return invoices.filter((invoice) => propertyUnitIds.has(invoice.houseUnitId));
  }, [invoicesQuery.data, propertyUnitIds, selectedUnitId]);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Invoices" }} />
      <Text style={styles.title}>Property invoices</Text>
      <Text style={styles.copy}>Property ID: {propertyId}</Text>

      <LabeledInput
        label="Period filter (YYYY-MM)"
        value={periodFilter}
        onChangeText={setPeriodFilter}
        autoCapitalize="none"
      />
      <LabeledSelect
        label="Unit filter"
        value={selectedUnitId}
        options={unitOptions}
        onValueChange={setSelectedUnitId}
      />

      {unitsQuery.isLoading ? <Text style={styles.copy}>Loading units...</Text> : null}
      {unitsQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(unitsQuery.error))}</Text>
      ) : null}
      {invoicesQuery.isLoading ? <Text style={styles.copy}>Loading invoices...</Text> : null}
      {invoicesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(invoicesQuery.error))}</Text>
      ) : null}
      {!session.orgId ? <Text style={styles.copy}>Invoice listing requires an org session.</Text> : null}

      {!invoicesQuery.isLoading && session.orgId && !visibleInvoices.length ? (
        <Text style={styles.copy}>No invoices match the selected filters.</Text>
      ) : null}

      <View style={styles.list}>
        {visibleInvoices.map((invoice) => (
          <View key={invoice.id} style={styles.card}>
            <Text style={styles.cardTitle}>Invoice {invoice.id}</Text>
            <Text style={styles.cardCopy}>Status: {invoice.status}</Text>
            <Text style={styles.cardCopy}>Unit: {invoice.houseUnitId}</Text>
            <Text style={styles.cardCopy}>Period: {invoice.period}</Text>
            <Text style={styles.cardCopy}>Total: {invoice.total}</Text>
            <Text style={styles.cardCopy}>Created: {invoice.createdAt}</Text>
            <Text style={styles.cardCopy}>Lines: {invoice.lines.length}</Text>
            <Text style={styles.cardCopy}>Payments: {invoice.payments.length}</Text>
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
