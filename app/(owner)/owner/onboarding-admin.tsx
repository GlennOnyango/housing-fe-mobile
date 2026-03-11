import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function OwnerOnboardingAdminScreen() {
  const { unitId: prefilledUnitId } = useLocalSearchParams<{ unitId?: string }>();
  const { session, setOrgId } = useSession();
  const [orgId, setOrgIdInput] = useState(session.orgId ?? "");
  const [configJson, setConfigJson] = useState("{}");
  const [templateName, setTemplateName] = useState("");
  const [templateMarkdown, setTemplateMarkdown] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [versionMarkdown, setVersionMarkdown] = useState("");
  const [inviteUnitId, setInviteUnitId] = useState(prefilledUnitId ?? "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onboardingConfigQuery = useQuery({
    queryKey: ["owner", "onboarding-config", orgId],
    enabled: Boolean(orgId),
    queryFn: () => ownerApi.getOnboardingConfig(orgId),
  });

  const leaseTemplatesQuery = useQuery({
    queryKey: ["owner", "lease-templates"],
    queryFn: () => ownerApi.listLeaseTemplates({ page: 1, pageSize: 50 }),
  });

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.parse(configJson) as Record<string, unknown>;
      return ownerApi.updateOnboardingConfig(orgId, payload);
    },
    onSuccess: () => {
      setOrgId(orgId || undefined);
      setMessage("Onboarding config updated.");
      setError(null);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.onboarding-config.update", mutationError));
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () =>
      ownerApi.createLeaseTemplate({
        name: templateName,
        documentMarkdown: templateMarkdown || undefined,
      }),
    onSuccess: (template) => {
      setMessage(`Lease template created: ${template.id}`);
      setError(null);
      setTemplateName("");
      setTemplateMarkdown("");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.lease-template.create", mutationError));
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: async () =>
      ownerApi.newLeaseTemplateVersion(templateId, {
        documentMarkdown: versionMarkdown || undefined,
      }),
    onSuccess: (template) => {
      setMessage(`New template version created (v${template.version}).`);
      setError(null);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.lease-template.new-version", mutationError));
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () =>
      ownerApi.inviteTenant(inviteUnitId, {
        email: inviteEmail || undefined,
      }),
    onSuccess: (result) => {
      setMessage(`Invite token issued: ${result.token}`);
      setError(null);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invite-tenant", mutationError));
    },
  });

  const onboardingConfigText = useMemo(() => {
    if (!onboardingConfigQuery.data) {
      return "Not loaded";
    }

    return JSON.stringify(onboardingConfigQuery.data.settings, null, 2);
  }, [onboardingConfigQuery.data]);

  return (
    <Screen>
      <Text style={styles.title}>Onboarding admin</Text>

      <SectionCard title="Org onboarding config">
        <LabeledInput label="Org ID" value={orgId} onChangeText={setOrgIdInput} />
        <Text style={styles.muted}>Current config: {onboardingConfigText}</Text>
        <LabeledInput
          label="Updated config JSON"
          value={configJson}
          onChangeText={setConfigJson}
          multiline
        />
        <PrimaryButton
          onPress={() => updateConfigMutation.mutate()}
          loading={updateConfigMutation.isPending}
          disabled={!orgId.trim()}
        >
          Save config
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Lease templates">
        <LabeledInput label="Name" value={templateName} onChangeText={setTemplateName} />
        <LabeledInput
          label="Document markdown"
          value={templateMarkdown}
          onChangeText={setTemplateMarkdown}
          multiline
        />
        <PrimaryButton
          onPress={() => createTemplateMutation.mutate()}
          loading={createTemplateMutation.isPending}
          disabled={!templateName}
        >
          Create template
        </PrimaryButton>
        <Text style={styles.muted}>
          Existing templates: {(leaseTemplatesQuery.data?.items ?? []).length}
        </Text>
      </SectionCard>

      <SectionCard title="Create template version">
        <LabeledInput label="Template ID" value={templateId} onChangeText={setTemplateId} />
        <LabeledInput
          label="Document markdown"
          value={versionMarkdown}
          onChangeText={setVersionMarkdown}
          multiline
        />
        <PrimaryButton
          onPress={() => newVersionMutation.mutate()}
          loading={newVersionMutation.isPending}
          disabled={!templateId || !versionMarkdown}
        >
          New version
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Invite tenant">
        <LabeledInput label="Unit ID" value={inviteUnitId} onChangeText={setInviteUnitId} />
        <LabeledInput
          label="Tenant email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <PrimaryButton
          onPress={() => inviteMutation.mutate()}
          loading={inviteMutation.isPending}
          disabled={!inviteUnitId || !inviteEmail}
        >
          Create invite token
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
  muted: {
    color: "#64748b",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
});
