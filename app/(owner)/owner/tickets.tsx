import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import type { TicketStatus } from "@/src/api/generated";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function OwnerTicketsScreen() {
  const { session, setOrgId } = useSession();
  const [orgId, setOrgIdInput] = useState(session.orgId ?? "");
  const [ticketId, setTicketId] = useState("");
  const [status, setStatus] = useState<TicketStatus>("IN_PROGRESS");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["owner", "tickets", orgId],
    enabled: Boolean(orgId),
    queryFn: () => ownerApi.listOrgTickets(orgId, { page: 1, pageSize: 50 }),
  });

  const updateTicketMutation = useMutation({
    mutationFn: async () => ownerApi.updateOrgTicket(orgId, ticketId, { status }),
    onSuccess: () => {
      setMessage("Ticket updated.");
      setError(null);
      setOrgId(orgId || undefined);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.tickets.update", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Ticket triage</Text>
      <LabeledInput label="Org ID" value={orgId} onChangeText={setOrgIdInput} />
      <PrimaryButton onPress={() => setOrgId(orgId || undefined)} tone="light">
        Save org context
      </PrimaryButton>

      <SectionCard title="Update ticket status">
        <LabeledInput label="Ticket ID" value={ticketId} onChangeText={setTicketId} />
        <LabeledSelect
          label="Status"
          value={status}
          onValueChange={(next) => setStatus(next as TicketStatus)}
          options={[
            { label: "Open", value: "OPEN" },
            { label: "In Progress", value: "IN_PROGRESS" },
            { label: "Resolved", value: "RESOLVED" },
            { label: "Closed", value: "CLOSED" },
          ]}
        />
        <PrimaryButton
          onPress={() => updateTicketMutation.mutate()}
          loading={updateTicketMutation.isPending}
          disabled={!orgId || !ticketId || !status}
        >
          Update ticket
        </PrimaryButton>
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Org ticket feed">
        {ticketsQuery.isLoading ? <Text>Loading tickets...</Text> : null}
        {ticketsQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(ticketsQuery.error))}</Text>
        ) : null}
        {(ticketsQuery.data?.items ?? []).map((ticket) => (
          <Text key={ticket.id} style={styles.item}>
            {ticket.id}: {ticket.title} [{ticket.status}]
          </Text>
        ))}
      </SectionCard>
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
  item: {
    color: "#334155",
  },
});
