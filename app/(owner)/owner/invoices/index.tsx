import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

function currentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export default function OwnerInvoicesScreen() {
  const { session, setOrgId } = useSession();
  const queryClient = useQueryClient();
  const [orgId, setOrgIdInput] = useState(session.orgId ?? "");
  const [period, setPeriod] = useState(currentPeriod());
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [customExpense, setCustomExpense] = useState("");
  const [reason, setReason] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("1440");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const propertiesQuery = useQuery({
    queryKey: ["owner", "invoice-admin", "properties"],
    queryFn: () => ownerApi.listProperties({ page: 1, pageSize: 100 }),
  });

  const unitsQuery = useQuery({
    queryKey: ["owner", "invoice-admin", "units", selectedPropertyId],
    enabled: Boolean(selectedPropertyId),
    queryFn: () => ownerApi.listUnits(selectedPropertyId, { page: 1, pageSize: 100 }),
  });

  const invoicesQuery = useQuery({
    queryKey: ["owner", "invoices", orgId, period, selectedUnitId],
    enabled: Boolean(orgId),
    queryFn: () =>
      ownerApi.listInvoices(orgId, {
        period: period.trim() || undefined,
        unitId: selectedUnitId || undefined,
      }),
  });

  const propertyOptions = useMemo(
    () => [
      { label: "All properties", value: "" },
      ...(propertiesQuery.data?.items ?? []).map((property) => ({
        label: property.name,
        value: property.id,
      })),
    ],
    [propertiesQuery.data?.items],
  );

  const unitOptions = useMemo(
    () => [
      { label: selectedPropertyId ? "All units in property" : "Select a property first", value: "" },
      ...((unitsQuery.data?.items ?? []).map((unit) => ({
        label: unit.unitLabel,
        value: unit.id,
      })) as Array<{ label: string; value: string }>),
    ],
    [selectedPropertyId, unitsQuery.data?.items],
  );

  const propertyUnitIds = useMemo(
    () => new Set((unitsQuery.data?.items ?? []).map((unit) => unit.id)),
    [unitsQuery.data?.items],
  );

  const visibleInvoices = useMemo(() => {
    const invoices = invoicesQuery.data ?? [];
    if (!selectedPropertyId || selectedUnitId) {
      return invoices;
    }

    return invoices.filter((invoice) => propertyUnitIds.has(invoice.houseUnitId));
  }, [invoicesQuery.data, propertyUnitIds, selectedPropertyId, selectedUnitId]);

  const generateMutation = useMutation({
    mutationFn: async () =>
      ownerApi.generateInvoices(orgId, {
        period: period.trim() || undefined,
        propertyId: selectedPropertyId || undefined,
        unitId: selectedUnitId || undefined,
        customExpense: customExpense.trim() ? Number(customExpense) : undefined,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (result) => {
      setMessage(`Generated ${result.count} invoice(s).`);
      setError(null);
      setOrgId(orgId || undefined);
      void queryClient.invalidateQueries({ queryKey: ["owner", "invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "dashboard", "invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "property-invoices-count"] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-invoices-count"] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invoices.generate", mutationError));
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (invoiceId: string) =>
      ownerApi.generateInvoiceLink(orgId, invoiceId, Number(ttlMinutes)),
    onSuccess: (result) => {
      setMessage(`Share token for invoice ${result.id}: ${result.token}`);
      setError(null);
      setOrgId(orgId || undefined);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invoices.link", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Invoice admin</Text>

      <SectionCard title="Generate invoices">
        <LabeledInput label="Org ID" value={orgId} onChangeText={setOrgIdInput} />
        <LabeledInput
          label="Period (YYYY-MM)"
          value={period}
          onChangeText={setPeriod}
          autoCapitalize="none"
        />
        <LabeledSelect
          label="Property"
          value={selectedPropertyId}
          options={propertyOptions}
          onValueChange={(value) => {
            setSelectedPropertyId(value);
            setSelectedUnitId("");
          }}
        />
        <LabeledSelect
          label="Unit"
          value={selectedUnitId}
          options={unitOptions}
          onValueChange={setSelectedUnitId}
        />
        <LabeledInput
          label="Custom expense"
          value={customExpense}
          onChangeText={setCustomExpense}
          keyboardType="numeric"
          placeholder="Optional"
        />
        <LabeledInput label="Reason" value={reason} onChangeText={setReason} placeholder="Optional" />
        <PrimaryButton
          onPress={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          disabled={!orgId || !period.trim()}
        >
          Generate invoices
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Invoice list" subtitle="Use the generate button on any invoice to create a share token.">
        <LabeledInput
          label="Share token TTL minutes"
          value={ttlMinutes}
          onChangeText={setTtlMinutes}
          keyboardType="number-pad"
        />

        {invoicesQuery.isLoading ? <Text>Loading invoices...</Text> : null}
        {invoicesQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(invoicesQuery.error))}</Text>
        ) : null}
        {!orgId ? <Text style={styles.copy}>Enter org ID to view invoices.</Text> : null}

        {!invoicesQuery.isLoading && orgId && !visibleInvoices.length ? (
          <Text style={styles.copy}>No invoices found for the current filters.</Text>
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
              <PrimaryButton
                onPress={() => linkMutation.mutate(invoice.id)}
                loading={linkMutation.isPending && linkMutation.variables === invoice.id}
                disabled={!ttlMinutes.trim()}
              >
                Generate share token
              </PrimaryButton>
            </View>
          ))}
        </View>
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  list: {
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardCopy: {
    color: "#334155",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
});
