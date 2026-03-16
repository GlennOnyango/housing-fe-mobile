import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
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
  const initialPeriod = currentPeriod();
  const [orgId, setOrgIdInput] = useState(session.orgId ?? "");
  const [period, setPeriod] = useState(initialPeriod);
  const [invoiceId, setInvoiceId] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("1440");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () =>
      ownerApi.generateInvoices(orgId, {
        period,
      }),
    onSuccess: (result) => {
      setMessage(`Generated ${result.count} invoice(s).`);
      setError(null);
      setOrgId(orgId || undefined);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invoices.generate", mutationError));
    },
  });

  const linkMutation = useMutation({
    mutationFn: async () =>
      ownerApi.generateInvoiceLink(orgId, invoiceId, Number(ttlMinutes)),
    onSuccess: (result) => {
      const output = result.url ? `${result.url} (token: ${result.token})` : result.token;
      setMessage(`Invoice link: ${output}`);
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
        <PrimaryButton
          onPress={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          disabled={!orgId || !period}
        >
          Generate invoices
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Share link">
        <LabeledInput label="Org ID" value={orgId} onChangeText={setOrgIdInput} />
        <LabeledInput label="Invoice ID" value={invoiceId} onChangeText={setInvoiceId} />
        <LabeledInput
          label="TTL minutes"
          value={ttlMinutes}
          onChangeText={setTtlMinutes}
          keyboardType="number-pad"
        />
        <PrimaryButton
          onPress={() => linkMutation.mutate()}
          loading={linkMutation.isPending}
          disabled={!orgId || !invoiceId || !ttlMinutes}
        >
          Generate share link
        </PrimaryButton>
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
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
});
