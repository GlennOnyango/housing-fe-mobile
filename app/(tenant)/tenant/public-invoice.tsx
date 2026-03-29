import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
        <View style={styles.stack}>
          <SectionCard title={`Invoice ${invoiceQuery.data.id}`} subtitle={invoiceQuery.data.status}>
            <Text>Total: {invoiceQuery.data.total}</Text>
            <Text>Period: {invoiceQuery.data.period}</Text>
            <Text>Unit: {invoiceQuery.data.houseUnitId}</Text>
            <Text>Created: {invoiceQuery.data.createdAt}</Text>
          </SectionCard>

          <SectionCard title="Lines">
            {invoiceQuery.data.lines.length ? (
              invoiceQuery.data.lines.map((line) => (
                <View key={line.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{line.type}</Text>
                  <Text style={styles.rowCopy}>Amount: {line.amount}</Text>
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
                </View>
              ))
            ) : (
              <Text>No payments recorded.</Text>
            )}
          </SectionCard>
        </View>
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
