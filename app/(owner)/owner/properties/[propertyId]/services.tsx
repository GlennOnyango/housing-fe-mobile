import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { messageFromLoggedApiError, normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

function emptyServiceForm() {
  return {
    category: "",
    name: "",
    phoneNumber: "",
  };
}

export default function PropertyServicesScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [serviceProviderObj, setServiceProviderObj] = useState(emptyServiceForm);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["owner", "services", propertyId],
    enabled: Boolean(propertyId),
    queryFn: () => ownerApi.listServiceProviders(propertyId, undefined, { page: 1, pageSize: 100 }),
  });

  function resetForm() {
    setSelectedServiceId(null);
    setServiceProviderObj(emptyServiceForm());
    setShowForm(false);
    setError(null);
  }

  const createServiceMutation = useMutation({
    mutationFn: async () =>
      ownerApi.createServiceProvider(propertyId, {
        category: serviceProviderObj.category.trim(),
        providerName: serviceProviderObj.name.trim(),
        providerPhone: serviceProviderObj.phoneNumber.trim() || undefined,
      }),
    onSuccess: () => {
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["owner", "services", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "property-services-count", propertyId] });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.service.create", mutationError));
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedServiceId) {
        throw new Error("No service selected for update.");
      }

      return ownerApi.updateServiceProvider(selectedServiceId, {
        category: serviceProviderObj.category.trim(),
        providerName: serviceProviderObj.name.trim(),
        providerPhone: serviceProviderObj.phoneNumber.trim() || undefined,
      });
    },
    onSuccess: () => {
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["owner", "services", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "property-services-count", propertyId] });
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.service.update", mutationError));
    },
  });

  const isEditing = Boolean(selectedServiceId);
  const submitLoading = createServiceMutation.isPending || updateServiceMutation.isPending;

  return (
    <Screen>
      <Stack.Screen options={{ title: "Services" }} />
      <Text style={styles.title}>Services</Text>
      <Text style={styles.copy}>Property ID: {propertyId}</Text>

      <PrimaryButton
        tone="light"
        onPress={() => {
          if (showForm) {
            resetForm();
            return;
          }

          setShowForm(true);
          setSelectedServiceId(null);
          setServiceProviderObj(emptyServiceForm());
          setError(null);
        }}
      >
        {showForm ? "Close service form" : "Add new service"}
      </PrimaryButton>

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{isEditing ? "Update service" : "Add service"}</Text>
          <LabeledInput
            label="Service Category"
            value={serviceProviderObj.category}
            onChangeText={(category) => {
              setServiceProviderObj((current) => ({
                ...current,
                category,
              }));
            }}
          />

          <LabeledInput
            label="Service Name"
            value={serviceProviderObj.name}
            onChangeText={(name) => {
              setServiceProviderObj((current) => ({
                ...current,
                name,
              }));
            }}
          />

          <LabeledInput
            label="Contact"
            value={serviceProviderObj.phoneNumber}
            onChangeText={(phoneNumber) => {
              setServiceProviderObj((current) => ({
                ...current,
                phoneNumber,
              }));
            }}
          />

          <PrimaryButton
            onPress={() => {
              if (isEditing) {
                updateServiceMutation.mutate();
                return;
              }

              createServiceMutation.mutate();
            }}
            loading={submitLoading}
            disabled={!serviceProviderObj.category.trim() || !serviceProviderObj.name.trim()}
          >
            {isEditing ? "Update service" : "Save service"}
          </PrimaryButton>

          {isEditing ? (
            <PrimaryButton tone="light" onPress={resetForm}>
              Cancel editing
            </PrimaryButton>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {servicesQuery.isLoading ? <Text style={styles.copy}>Loading services...</Text> : null}
      {servicesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(servicesQuery.error))}</Text>
      ) : null}

      <View style={styles.list}>
        {(servicesQuery.data?.items ?? []).map((service) => (
          <Pressable
            key={service.id}
            accessibilityRole="button"
            onPress={() => {
              setSelectedServiceId(service.id);
              setServiceProviderObj({
                category: service.category,
                name: service.providerName,
                phoneNumber: service.providerPhone || "",
              });
              setShowForm(true);
              setError(null);
            }}
            style={[
              styles.card,
              selectedServiceId === service.id ? styles.cardSelected : null,
            ]}
          >
            <Text style={styles.cardTitle}>{service.providerName}</Text>
            <Text style={styles.cardCopy}>Category: {service.category}</Text>
            <Text style={styles.cardCopy}>
              Contact: {service.providerPhone || "No phone number"}
            </Text>
            <Text style={styles.cardCopy}>Status: {service.status}</Text>
            <Text style={styles.cardHint}>Tap to edit</Text>
          </Pressable>
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
  copy: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
  form: {
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  formTitle: {
    color: "#0f172a",
    fontWeight: "700",
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
  cardSelected: {
    borderColor: "#2563eb",
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  cardCopy: {
    color: "#334155",
  },
  cardHint: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
