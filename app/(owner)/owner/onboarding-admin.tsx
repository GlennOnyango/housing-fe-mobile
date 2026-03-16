import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
  const [templatePropertyId, setTemplatePropertyId] = useState("");
  const [templateObjectKey, setTemplateObjectKey] = useState("");
  const [templateFileName, setTemplateFileName] = useState("");
  const [templateContentType, setTemplateContentType] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [versionPropertyId, setVersionPropertyId] = useState("");
  const [versionObjectKey, setVersionObjectKey] = useState("");
  const [versionFileName, setVersionFileName] = useState("");
  const [versionContentType, setVersionContentType] = useState("");
  const [inviteUnitId, setInviteUnitId] = useState(prefilledUnitId ?? "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
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
        propertyId: templatePropertyId.trim(),
        name: templateName.trim(),
        documentObjectKey: templateObjectKey.trim(),
        documentFileName: templateFileName.trim() || undefined,
        documentContentType: templateContentType.trim() || undefined,
      }),
    onSuccess: (template) => {
      setMessage(`Lease template created: ${template.id}`);
      setError(null);
      setTemplateName("");
      setTemplatePropertyId("");
      setTemplateObjectKey("");
      setTemplateFileName("");
      setTemplateContentType("");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.lease-template.create", mutationError));
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: async () =>
      ownerApi.newLeaseTemplateVersion(templateId, {
        propertyId: versionPropertyId.trim() || undefined,
        documentObjectKey: versionObjectKey.trim() || undefined,
        documentFileName: versionFileName.trim() || undefined,
        documentContentType: versionContentType.trim() || undefined,
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
        email: inviteEmail.trim() || undefined,
        phone: invitePhone.trim(),
      }),
    onSuccess: (result) => {
      setInviteToken(result.token);
      setMessage("Invite token issued.");
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
          label="Property ID"
          value={templatePropertyId}
          onChangeText={setTemplatePropertyId}
        />
        <LabeledInput
          label="Document object key"
          value={templateObjectKey}
          onChangeText={setTemplateObjectKey}
        />
        <LabeledInput
          label="Document file name"
          value={templateFileName}
          onChangeText={setTemplateFileName}
        />
        <LabeledInput
          label="Document content type"
          value={templateContentType}
          onChangeText={setTemplateContentType}
          multiline
        />
        <PrimaryButton
          onPress={() => createTemplateMutation.mutate()}
          loading={createTemplateMutation.isPending}
          disabled={!templateName.trim() || !templatePropertyId.trim() || !templateObjectKey.trim()}
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
          label="Property ID (optional)"
          value={versionPropertyId}
          onChangeText={setVersionPropertyId}
        />
        <LabeledInput
          label="Document object key"
          value={versionObjectKey}
          onChangeText={setVersionObjectKey}
        />
        <LabeledInput
          label="Document file name (optional)"
          value={versionFileName}
          onChangeText={setVersionFileName}
        />
        <LabeledInput
          label="Document content type (optional)"
          value={versionContentType}
          onChangeText={setVersionContentType}
          multiline
        />
        <PrimaryButton
          onPress={() => newVersionMutation.mutate()}
          loading={newVersionMutation.isPending}
          disabled={!templateId.trim() || !versionObjectKey.trim()}
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
        <LabeledInput
          label="Tenant phone"
          value={invitePhone}
          onChangeText={setInvitePhone}
          keyboardType="phone-pad"
        />
        <PrimaryButton
          onPress={() => inviteMutation.mutate()}
          loading={inviteMutation.isPending}
          disabled={!inviteUnitId.trim() || !invitePhone.trim()}
        >
          Create invite token
        </PrimaryButton>
        {inviteToken ? (
          <Pressable
            style={styles.tokenRow}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(inviteToken);
                setMessage("Invite token copied.");
                setError(null);
                Alert.alert("Copy status", "Invite token copied successfully.");
              } catch {
                Alert.alert("Copy status", "Failed to copy invite token.");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Copy invite token"
          >
            <View style={styles.tokenTextWrap}>
              <Text style={styles.tokenLabel}>Invite token</Text>
              <Text style={styles.tokenText} selectable>
                {inviteToken}
              </Text>
            </View>
            <Ionicons name="copy-outline" size={18} color="#1d4ed8" />
          </Pressable>
        ) : null}
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
  tokenRow: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tokenTextWrap: {
    flex: 1,
    gap: 2,
  },
  tokenLabel: {
    color: "#1e3a8a",
    fontWeight: "600",
    fontSize: 12,
  },
  tokenText: {
    color: "#0f172a",
  },
  error: {
    color: "#b91c1c",
  },
});
