import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

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
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ["owner", "unit-invoices", session.orgId, params.unitId, period],
    enabled: Boolean(session.orgId && params.unitId),
    queryFn: () =>
      ownerApi.listInvoices(session.orgId as string, {
        period: period.trim() || undefined,
        unitId: params.unitId,
      }),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!session.orgId) {
        throw new Error("Missing orgId in session. Re-open from owner dashboard.");
      }

      return ownerApi.generateInvoices(session.orgId, {
        period: period.trim() || undefined,
        propertyId: params.propertyId || undefined,
        unitId: params.unitId,
      });
    },
    onSuccess: (result) => {
      setMessage(`Generated ${result.count} invoice(s).`);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "property-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "dashboard", "invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "property-invoices-count"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-invoices-count"] });
    },
    onError: (mutationError) => {
      setMessage(null);
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

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {invoicesQuery.isLoading ? <Text style={styles.copy}>Loading invoices...</Text> : null}
      {invoicesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(invoicesQuery.error))}</Text>
      ) : null}

      {!invoicesQuery.isLoading && !(invoicesQuery.data?.length ?? 0) ? (
        <Text style={styles.copy}>No invoices for this unit yet.</Text>
      ) : null}

      <View style={styles.list}>
        {(invoicesQuery.data ?? []).map((invoice) => (
          <View key={invoice.id} style={styles.card}>
            <Text style={styles.cardTitle}>Invoice {invoice.id}</Text>
            <Text style={styles.cardCopy}>Status: {invoice.status}</Text>
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
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
  success: {
    color: "#166534",
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
