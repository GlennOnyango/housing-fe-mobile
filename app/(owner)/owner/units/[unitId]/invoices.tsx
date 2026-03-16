import { useMemo, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { addGeneratedInvoices, listGeneratedInvoices } from "@/src/features/generated-invoices-store";

function currentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export default function UnitInvoicesScreen() {
  const params = useLocalSearchParams<{
    unitId: string;
    propertyId?: string;
    unitLabel?: string;
  }>();
  const { session } = useSession();
  const [period, setPeriod] = useState(currentPeriod());
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const generatedForUnit = useMemo(
    () =>
      listGeneratedInvoices().filter(
        (item) => item.unitId === params.unitId && item.propertyId === (params.propertyId ?? ""),
      ),
    [params.propertyId, params.unitId, refreshTick],
  );

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!session.orgId) {
        throw new Error("Missing orgId in session. Re-open from owner dashboard.");
      }

      return ownerApi.generateInvoices(session.orgId, { period });
    },
    onSuccess: (result) => {
      addGeneratedInvoices({
        invoiceIds: result.created ?? [],
        propertyId: params.propertyId ?? "",
        unitId: params.unitId,
        unitLabel: params.unitLabel ?? params.unitId,
        period,
        generatedAtIso: new Date().toISOString(),
      });
      setRefreshTick((value) => value + 1);
      setError(null);
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.unit.invoices.generate", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: params.unitLabel ?? "Unit Invoices" }} />
      <Text style={styles.title}>Unit invoices</Text>
      <Text style={styles.copy}>Unit: {params.unitLabel ?? params.unitId}</Text>

      <LabeledInput
        label="Period (YYYY-MM)"
        value={period}
        onChangeText={setPeriod}
        autoCapitalize="none"
      />

      <PrimaryButton
        onPress={() => generateMutation.mutate()}
        loading={generateMutation.isPending}
        disabled={!period.trim()}
      >
        Generate invoice for this unit
      </PrimaryButton>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.subtitle}>Generated invoices</Text>
      {!generatedForUnit.length ? (
        <Text style={styles.copy}>No generated invoices for this unit yet.</Text>
      ) : (
        <View style={styles.list}>
          {generatedForUnit.map((invoice) => (
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
  subtitle: {
    marginTop: 4,
    fontSize: 16,
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
