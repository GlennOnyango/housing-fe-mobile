import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  messageFromLoggedApiError,
  normalizeApiError,
  problemToMessage,
} from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledDateInput } from "@/src/components/labeled-date-input";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

function emptyForm() {
  return {
    propertyId: "",
    name: "",
    price: "",
    condition: "GOOD",
    fixedOn: "",
  };
}

const CONDITION_OPTIONS = [
  { label: "Good", value: "GOOD" },
  { label: "Broken", value: "BROKEN" },
] as const;

export default function AmenitiesScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const propertiesQuery = useQuery({
    queryKey: ["owner", "properties", "amenity-selector"],
    queryFn: () => ownerApi.listProperties({ page: 1, pageSize: 100 }),
  });

  const propertyOptions = useMemo(
    () =>
      (propertiesQuery.data?.items ?? []).map((property) => ({
        label: property.name,
        value: property.id,
      })),
    [propertiesQuery.data?.items],
  );

  const selectedPropertyId = form.propertyId || propertyOptions[0]?.value || "";

  const amenitiesQuery = useQuery({
    queryKey: ["owner", "amenities", selectedPropertyId],
    enabled: Boolean(selectedPropertyId),
    queryFn: () => ownerApi.listAmenities(selectedPropertyId, { page: 1, pageSize: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      ownerApi.createAmenity(form.propertyId, {
        name: form.name.trim(),
        price: Number(form.price),
        condition: form.condition === "BROKEN" ? "BROKEN" : "GOOD",
        fixedOn: form.fixedOn.trim() || undefined,
      }),
    onSuccess: () => {
      setMessage("Amenity created.");
      setError(null);
      const propertyId = form.propertyId;
      setForm((current) => ({
        ...emptyForm(),
        propertyId,
      }));
      void queryClient.invalidateQueries({ queryKey: ["owner", "amenities", propertyId] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.amenities.create", mutationError));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAmenityId) {
        throw new Error("No amenity selected for update.");
      }

      return ownerApi.updateAmenity(selectedAmenityId, {
        name: form.name.trim(),
        price: Number(form.price),
        condition: form.condition === "BROKEN" ? "BROKEN" : "GOOD",
        fixedOn: form.fixedOn.trim() || undefined,
      });
    },
    onSuccess: () => {
      setMessage("Amenity updated.");
      setError(null);
      const propertyId = form.propertyId;
      setSelectedAmenityId(null);
      setForm((current) => ({
        ...emptyForm(),
        propertyId,
      }));
      void queryClient.invalidateQueries({ queryKey: ["owner", "amenities", propertyId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities"] });
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.amenities.update", mutationError));
    },
  });

  const isEditing = Boolean(selectedAmenityId);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Amenities</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/owner/amenities/new",
              params: selectedPropertyId ? { propertyId: selectedPropertyId } : undefined,
            })
          }
          style={styles.linkButton}
        >
          <Text style={styles.linkButtonText}>Full create form</Text>
        </Pressable>
      </View>

      <SectionCard title={isEditing ? "Update amenity" : "Create amenity"}>
        <LabeledSelect
          label="Property"
          value={form.propertyId || selectedPropertyId}
          options={propertyOptions}
          onValueChange={(propertyId) => {
            setForm((current) => ({
              ...current,
              propertyId,
            }));
            setSelectedAmenityId(null);
            setMessage(null);
            setError(null);
          }}
          placeholder={propertiesQuery.isLoading ? "Loading properties..." : "Select property"}
        />
        <LabeledInput label="Amenity name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
        <LabeledInput
          label="Price"
          value={form.price}
          onChangeText={(price) => setForm((current) => ({ ...current, price }))}
          keyboardType="numeric"
          placeholder="0"
        />
        <LabeledSelect
          label="Condition"
          value={form.condition}
          options={CONDITION_OPTIONS}
          onValueChange={(condition) => setForm((current) => ({ ...current, condition }))}
        />
        <LabeledDateInput
          label="Fixed on"
          value={form.fixedOn}
          onChangeText={(fixedOn) => setForm((current) => ({ ...current, fixedOn }))}
          placeholder="Select fixed date"
        />
        <PrimaryButton
          onPress={() => {
            if (isEditing) {
              updateMutation.mutate();
              return;
            }
            createMutation.mutate();
          }}
          loading={createMutation.isPending || updateMutation.isPending}
          disabled={!form.propertyId && !selectedPropertyId || !form.name.trim() || !form.price.trim()}
        >
          {isEditing ? "Update amenity" : "Create amenity"}
        </PrimaryButton>
        {isEditing ? (
          <PrimaryButton
            tone="light"
            onPress={() => {
              setSelectedAmenityId(null);
              setForm((current) => ({
                ...emptyForm(),
                propertyId: current.propertyId,
              }));
            }}
          >
            Cancel editing
          </PrimaryButton>
        ) : null}
      </SectionCard>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionCard title="Amenity list" subtitle={selectedPropertyId ? "Tap an amenity to edit it." : "Select a property to view amenities."}>
        {amenitiesQuery.isLoading ? <Text>Loading amenities...</Text> : null}
        {amenitiesQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(amenitiesQuery.error))}</Text>
        ) : null}
        {(amenitiesQuery.data?.items ?? []).map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => {
              setSelectedAmenityId(item.id);
              setForm({
                propertyId: item.propertyId ?? selectedPropertyId,
                name: item.name,
                price: item.price,
                condition: item.condition,
                fixedOn: item.fixedOn ?? "",
              });
              setMessage(null);
              setError(null);
            }}
            style={[styles.itemCard, selectedAmenityId === item.id ? styles.itemCardSelected : null]}
          >
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemCopy}>Price: {item.price}</Text>
            <Text style={styles.itemCopy}>Condition: {item.condition}</Text>
            <Text style={styles.itemCopy}>Fixed on: {item.fixedOn ?? "Not set"}</Text>
          </Pressable>
        ))}
        {!amenitiesQuery.isLoading && !(amenitiesQuery.data?.items ?? []).length ? (
          <Text style={styles.itemCopy}>No amenities found for this property.</Text>
        ) : null}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  linkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  linkButtonText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  success: {
    color: "#166534",
  },
  error: {
    color: "#b91c1c",
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 4,
  },
  itemCardSelected: {
    borderColor: "#2563eb",
  },
  itemTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  itemCopy: {
    color: "#475569",
  },
});
