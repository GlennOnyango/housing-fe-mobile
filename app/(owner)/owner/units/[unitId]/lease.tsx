import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function UnitLeaseAgreementScreen() {
  const { unitId, unitLabel } = useLocalSearchParams<{ unitId: string; unitLabel?: string }>();
  const queryClient = useQueryClient();

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateMarkdown, setNewTemplateMarkdown] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [updatedMarkdown, setUpdatedMarkdown] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leaseTemplatesQuery = useQuery({
    queryKey: ["owner", "lease-templates"],
    queryFn: () => ownerApi.listLeaseTemplates({ page: 1, pageSize: 100 }),
  });

  const templates = leaseTemplatesQuery.data?.items ?? [];

  const defaultTemplate = useMemo(() => {
    if (!templates.length) {
      return undefined;
    }
    return templates[0];
  }, [templates]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? defaultTemplate,
    [templates, templateId, defaultTemplate],
  );

  useEffect(() => {
    if (!templateId && defaultTemplate?.id) {
      setTemplateId(defaultTemplate.id);
    }
  }, [templateId, defaultTemplate?.id]);

  useEffect(() => {
    if (!updatedMarkdown && selectedTemplate?.documentMarkdown) {
      setUpdatedMarkdown(selectedTemplate.documentMarkdown);
    }
  }, [updatedMarkdown, selectedTemplate?.documentMarkdown]);

  const createTemplateMutation = useMutation({
    mutationFn: async () =>
      ownerApi.createLeaseTemplate({
        name: newTemplateName.trim(),
        documentMarkdown: newTemplateMarkdown.trim() || undefined,
      }),
    onSuccess: (template) => {
      setMessage(`Lease agreement created (template ${template.id}).`);
      setError(null);
      setTemplateId(template.id);
      setNewTemplateName("");
      setNewTemplateMarkdown("");
      void queryClient.invalidateQueries({ queryKey: ["owner", "lease-templates"] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.lease-template.create", mutationError));
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async () =>
      ownerApi.newLeaseTemplateVersion(templateId.trim(), {
        documentMarkdown: updatedMarkdown.trim() || undefined,
      }),
    onSuccess: (template) => {
      setMessage(`Lease agreement updated to version ${template.version}.`);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "lease-templates"] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.lease-template.new-version", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: unitLabel ? `${unitLabel} Lease` : "Lease Agreement" }} />
      <Text style={styles.title}>Lease agreement</Text>
      <Text style={styles.copy}>{unitLabel ? `Unit: ${unitLabel}` : `Unit ID: ${unitId}`}</Text>

      <SectionCard title="Add lease agreement document">
        <LabeledInput
          label="Template name"
          value={newTemplateName}
          onChangeText={setNewTemplateName}
        />
        <LabeledInput
          label="Lease markdown"
          value={newTemplateMarkdown}
          onChangeText={setNewTemplateMarkdown}
          multiline
        />
        <PrimaryButton
          onPress={() => createTemplateMutation.mutate()}
          loading={createTemplateMutation.isPending}
          disabled={!newTemplateName.trim()}
        >
          Add lease agreement
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="Edit current lease agreement">
        {leaseTemplatesQuery.isLoading ? <Text style={styles.copy}>Loading templates...</Text> : null}
        <LabeledInput label="Template ID" value={templateId} onChangeText={setTemplateId} />
        <Text style={styles.copy}>
          Current version: {selectedTemplate?.version ?? "-"} | Known templates: {templates.length}
        </Text>
        <LabeledInput
          label="Updated lease markdown"
          value={updatedMarkdown}
          onChangeText={setUpdatedMarkdown}
          multiline
        />
        <PrimaryButton
          onPress={() => updateTemplateMutation.mutate()}
          loading={updateTemplateMutation.isPending}
          disabled={!templateId.trim() || !updatedMarkdown.trim()}
        >
          Save lease updates
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
  copy: {
    color: "#475569",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
});
