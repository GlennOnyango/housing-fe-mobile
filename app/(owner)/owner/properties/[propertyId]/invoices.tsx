import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { Screen } from "@/src/components/screen";
import { listGeneratedInvoices } from "@/src/features/generated-invoices-store";

export default function PropertyInvoicesScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [periodFilter, setPeriodFilter] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [refreshTick] = useState(0);

  const unitsQuery = useQuery({
    queryKey: ["owner", "property-units", propertyId, "invoices-view"],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listUnits(propertyId, { page: 1, pageSize: 100 }),
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

  const filteredInvoices = useMemo(
    () =>
      listGeneratedInvoices().filter((item) => {
        if (item.propertyId !== propertyId) {
          return false;
        }
        if (selectedUnitId && item.unitId !== selectedUnitId) {
          return false;
        }
        if (periodFilter.trim() && !item.period.includes(periodFilter.trim())) {
          return false;
        }
        return true;
      }),
    [periodFilter, propertyId, selectedUnitId, refreshTick],
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: "Invoices" }} />
      <Text style={styles.title}>Generated invoices</Text>
      <Text style={styles.copy}>Property ID: {propertyId}</Text>

      <LabeledInput
        label="Date filter (YYYY-MM)"
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

      {!filteredInvoices.length ? (
        <Text style={styles.copy}>
          No generated invoices match the selected filters. Generate invoices from unit pages.
        </Text>
      ) : (
        <View style={styles.list}>
          {filteredInvoices.map((invoice) => (
            <View key={invoice.invoiceId} style={styles.card}>
              <Text style={styles.cardTitle}>Invoice {invoice.invoiceId}</Text>
              <Text style={styles.cardCopy}>Unit: {invoice.unitLabel}</Text>
              <Text style={styles.cardCopy}>Period: {invoice.period}</Text>
              <Text style={styles.cardCopy}>Generated: {invoice.generatedAtIso}</Text>
            </View>
          ))}
        </View>
      )}
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
