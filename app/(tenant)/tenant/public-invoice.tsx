import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { publicApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function PublicInvoiceScreen() {
  const search = useLocalSearchParams<{ token?: string }>();
  const [tokenInput, setTokenInput] = useState(search.token ?? "");
  const [activeToken, setActiveToken] = useState(search.token ?? "");

  const key = useMemo(() => ["public", "invoice", activeToken], [activeToken]);

  const invoiceQuery = useQuery({
    queryKey: key,
    enabled: Boolean(activeToken),
    queryFn: () => publicApi.getPublicInvoice(activeToken),
  });

  return (
    <Screen>
      <Text style={styles.title}>Secure invoice link</Text>
      <Text style={styles.copy}>
        Tenant cannot generate invoice links with current API. Paste a shared token to view.
      </Text>
      <LabeledInput label="Token" value={tokenInput} onChangeText={setTokenInput} />
      <PrimaryButton onPress={() => setActiveToken(tokenInput.trim())} disabled={!tokenInput.trim()}>
        Fetch public invoice
      </PrimaryButton>

      {invoiceQuery.isLoading ? <Text>Loading invoice...</Text> : null}
      {invoiceQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(invoiceQuery.error))}</Text>
      ) : null}

      {invoiceQuery.data ? (
        <SectionCard title={`Invoice ${invoiceQuery.data.invoice.id}`} subtitle={invoiceQuery.data.invoice.status}>
          <Text>Amount due: {invoiceQuery.data.invoice.amountDue}</Text>
          <Text>Due date: {invoiceQuery.data.invoice.dueDate}</Text>
          <Text>Org: {invoiceQuery.data.orgName ?? "N/A"}</Text>
          <Text>Tenant: {invoiceQuery.data.tenantName ?? "N/A"}</Text>
        </SectionCard>
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
  copy: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
});
