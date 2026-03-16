import { useMemo, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { filesApi, ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

type PickedLeaseFile = {
  uri: string;
  name: string;
  contentType: string;
  sizeBytes?: number;
};

function templatePreviewUri(previewUrl?: string | null) {
  if (!previewUrl) {
    return undefined;
  }

  if (previewUrl.startsWith("https://") || previewUrl.startsWith("http://")) {
    return previewUrl;
  }

  return undefined;
}

export default function UnitLeaseAgreementScreen() {
  const { unitId, unitLabel, propertyId: routePropertyId } = useLocalSearchParams<{
    unitId: string;
    unitLabel?: string;
    propertyId?: string;
  }>();
  const queryClient = useQueryClient();

  const [editorVisible, setEditorVisible] = useState(false);
  const [showPropertyOptions, setShowPropertyOptions] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<PickedLeaseFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inferredPropertyQuery = useQuery({
    queryKey: ["owner", "unit-property", unitId],
    enabled: Boolean(unitId) && !routePropertyId,
    retry: false,
    queryFn: async () => {
      const properties = await ownerApi.listProperties({ page: 1, pageSize: 100 });


      for (const property of properties.items) {
        const units = await ownerApi.listUnits(property.id, { page: 1, pageSize: 200 });


        if (units.items.some((unit) => unit.id === unitId)) {
          return property.id;
        }
      }


      throw new Error("Unable to infer property for this unit.");
    },
  });

  const propertyId = (routePropertyId ?? inferredPropertyQuery.data ?? "").trim();

  const leaseTemplatesQuery = useQuery({
    queryKey: ["owner", "lease-templates", propertyId, unitId],
    enabled: Boolean(propertyId),
    queryFn: () =>
      ownerApi.listLeaseTemplates({
        page: 1,
        pageSize: 200,
        propertyId,
        unitId,
      }),
  });

  const propertyTemplates = leaseTemplatesQuery.data?.items ?? [];

  const selectedTemplate = useMemo(() => {
    if (!propertyTemplates.length) {
      return undefined;
    }


    if (selectedTemplateId) {
      return propertyTemplates.find((template) => template.id === selectedTemplateId);
    }

    return propertyTemplates[0];
  }, [propertyTemplates, selectedTemplateId]);

  const hasLeaseDocument = propertyTemplates.length > 0;
  const selectedPreviewUri = templatePreviewUri(selectedTemplate?.previewUrl);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    setPickedFile({
      uri: asset.uri,
      name: asset.name ?? `lease-${Date.now()}`,
      contentType: asset.mimeType ?? "application/pdf",
      sizeBytes: asset.size ?? undefined,
    });
    setError(null);
  };

  const upsertLeaseMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) {
        throw new Error("Property ID is required. Open this screen from a property unit list.");
      }

      if (!pickedFile) {
        throw new Error("Pick a lease document first.");
      }

      const presigned = await filesApi.presignUpload({
        fileName: pickedFile.name,
        contentType: pickedFile.contentType,
        sizeBytes: pickedFile.sizeBytes,
      });

      const fileResponse = await fetch(pickedFile.uri);
      const blob = await fileResponse.blob();

      await filesApi.uploadToPresignedUrl(presigned.uploadUrl, blob, presigned.headers);

      await filesApi.createAsset({
        key: presigned.key,
        fileName: pickedFile.name,
        contentType: pickedFile.contentType,
        sizeBytes: pickedFile.sizeBytes,
      });

      if (!hasLeaseDocument) {
        return ownerApi.createLeaseTemplate({
          name: templateName.trim() || `${unitLabel ?? "Unit"} lease`,
          propertyId,
          unitId,
          documentObjectKey: presigned.key,
          documentFileName: pickedFile.name,
          documentContentType: pickedFile.contentType,
        });
      }

      if (!selectedTemplate?.id) {
        throw new Error("Select a lease document to edit.");
      }

      return ownerApi.newLeaseTemplateVersion(selectedTemplate.id, {
        propertyId,
        unitId,
        documentObjectKey: presigned.key,
        documentFileName: pickedFile.name,
        documentContentType: pickedFile.contentType,
      });
    },
    onSuccess: (template) => {
      setError(null);
      setMessage(
        hasLeaseDocument
          ? `Lease document updated to version ${template.version}.`
          : `Lease document created (${template.id}).`,
      );
      setPickedFile(null);
      setTemplateName("");
      setSelectedTemplateId(template.id);
      setEditorVisible(false);
      void queryClient.invalidateQueries({
        queryKey: ["owner", "lease-templates", propertyId, unitId],
      });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.unit-lease.upsert", mutationError));
    },
  });

  const handleSelectPropertyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setError(null);
    setMessage("Lease document selected from property options.");
    setShowPropertyOptions(false);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: unitLabel ? `${unitLabel} Lease` : "Lease Agreement" }} />

      <Text style={styles.title}>Lease agreement</Text>
      <Text style={styles.copy}>{unitLabel ? `Unit: ${unitLabel}` : `Unit ID: ${unitId}`}</Text>
      <Text style={styles.copy}>Property ID: {propertyId || "Inferring..."}</Text>

      <View style={styles.leaseCard}>
        <Text style={styles.cardTitle}>Lease Agreement</Text>
        <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
          {inferredPropertyQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#1d4ed8" />
              <Text style={styles.copy}>Inferring property...</Text>
            </View>
          ) : null}

          {leaseTemplatesQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#1d4ed8" />
              <Text style={styles.copy}>Loading lease documents...</Text>
            </View>
          ) : null}

          {leaseTemplatesQuery.isError ? (
            <Text style={styles.error}>
              {messageFromLoggedApiError("owner.lease-template.list", leaseTemplatesQuery.error)}
            </Text>
          ) : null}

          {!leaseTemplatesQuery.isLoading && !selectedTemplate ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No lease document for this property yet.</Text>
              <Text style={styles.copy}>Tap + to upload one from your phone.</Text>
            </View>
          ) : null}

          {selectedTemplate ? (
            <View style={styles.previewBlock}>
              <Text style={styles.previewHeading}>
                {selectedTemplate.name ?? `Template ${selectedTemplate.id}`}
              </Text>
              <Text style={styles.copy}>Version {selectedTemplate.version}</Text>
              <Text style={styles.copy}>
                File: {selectedTemplate.documentFileName ?? "Unknown file"}
              </Text>
              {selectedPreviewUri ? (
                <View style={styles.webviewWrap}>
                  <WebView source={{ uri: selectedPreviewUri }} />
                </View>
              ) : (
                <Text style={styles.copy}>
                  Preview unavailable for this lease template. You can still edit/replace the
                  document from the action button.
                </Text>
              )}
            </View>
          ) : null}
        </ScrollView>
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setEditorVisible(true)}
        style={styles.fab}
      >
        <Ionicons name={hasLeaseDocument ? "create-outline" : "add"} size={26} color="#ffffff" />
      </Pressable>

      <Modal transparent animationType="slide" visible={editorVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {hasLeaseDocument ? "Edit lease document" : "Add lease document"}
            </Text>
            <Text style={styles.copy}>Unit ID is inferred: {unitId}</Text>
            <Text style={styles.copy}>Property ID is inferred: {propertyId || "Unavailable"}</Text>

            {!hasLeaseDocument ? (
              <LabeledInput
                label="Template name"
                value={templateName}
                onChangeText={setTemplateName}
              />
            ) : null}

            <PrimaryButton onPress={pickDocument}>Upload from phone</PrimaryButton>
            {pickedFile ? (
              <Text style={styles.copy}>
                Selected: {pickedFile.name} ({pickedFile.contentType})
              </Text>
            ) : null}

            <PrimaryButton
              onPress={() => setShowPropertyOptions((prev) => !prev)}
              disabled={!propertyTemplates.length}
            >
              {showPropertyOptions ? "Hide property lease options" : "Add lease from property"}
            </PrimaryButton>

            {showPropertyOptions ? (
              <ScrollView style={styles.optionsList}>
                {propertyTemplates.map((template) => (
                  <Pressable
                    key={template.id}
                    onPress={() => handleSelectPropertyTemplate(template.id)}
                    style={[
                      styles.optionCard,
                      selectedTemplate?.id === template.id ? styles.optionCardSelected : null,
                    ]}
                  >
                    <Text style={styles.optionTitle}>{template.name ?? `Template ${template.id}`}</Text>
                    <Text style={styles.copy}>Version {template.version}</Text>
                    <Text style={styles.copy}>{template.documentFileName ?? "No file name"}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.modalActions}>
              <PrimaryButton
                onPress={() => upsertLeaseMutation.mutate()}
                loading={upsertLeaseMutation.isPending}
                disabled={!propertyId || !pickedFile}
              >
                {hasLeaseDocument ? "Save lease edit" : "Create lease document"}
              </PrimaryButton>
              <Pressable onPress={() => setEditorVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  leaseCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    minHeight: 320,
    justifyContent: "center",
    gap: 12,
  },
  centered: {
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#0f172a",
    fontWeight: "600",
    textAlign: "center",
  },
  previewBlock: {
    gap: 8,
  },
  previewHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  webviewWrap: {
    height: 360,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "90%",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  optionsList: {
    maxHeight: 180,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    padding: 10,
    marginBottom: 8,
    gap: 2,
  },
  optionCardSelected: {
    borderColor: "#1d4ed8",
    backgroundColor: "#eff6ff",
  },
  optionTitle: {
    fontWeight: "700",
    color: "#0f172a",
  },
  modalActions: {
    gap: 8,
    marginTop: 4,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  cancelText: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
