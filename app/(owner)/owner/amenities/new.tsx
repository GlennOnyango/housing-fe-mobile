import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledDateInput } from "@/src/components/labeled-date-input";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const CONDITION_OPTIONS = [
  { label: "Good", value: "GOOD" },
  { label: "Broken", value: "BROKEN" },
] as const;

export default function CreateAmenityScreen() {
  const { amenityId, propertyId, unitId, unitLabel, lockProperty, name: initialName, price: initialPrice, condition: initialCondition, fixedOn: initialFixedOn } = useLocalSearchParams<{
    amenityId?: string;
    propertyId?: string;
    unitId?: string;
    unitLabel?: string;
    lockProperty?: string;
    name?: string;
    price?: string;
    condition?: string;
    fixedOn?: string;
  }>();
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [price, setPrice] = useState(initialPrice ?? "");
  const [condition, setCondition] = useState(initialCondition === "BROKEN" ? "BROKEN" : "GOOD");
  const [fixedOn, setFixedOn] = useState(initialFixedOn ?? "");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ["owner", "properties", "amenity-create"],
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

  const selectedPropertyLabel =
    propertyOptions.find((option) => option.value === selectedPropertyId)?.label ?? selectedPropertyId;
  const propertyLocked = Boolean(propertyId) && (lockProperty === "1" || Boolean(unitId));
  const isEditing = Boolean(amenityId);

  function handleSuccess() {
    setError(null);
    void queryClient.invalidateQueries({ queryKey: ["owner", "amenities", selectedPropertyId] });
    if (unitId) {
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities", unitId] });
      void queryClient.invalidateQueries({ queryKey: ["owner", "unit-amenities-count", unitId] });
      router.replace({
        pathname: "/owner/units/[unitId]/amenities",
        params: { unitId, unitLabel: unitLabel ?? "", propertyId: selectedPropertyId },
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["owner", "property-amenities-count", selectedPropertyId] });
    router.replace({
      pathname: "/owner/properties/[propertyId]/amenities",
      params: { propertyId: selectedPropertyId },
    });
  }

  const createMutation = useMutation({
    mutationFn: async () =>
      ownerApi.createAmenity(selectedPropertyId, {
        unitId: unitId || undefined,
        name: name.trim(),
        price: Number(price),
        condition: condition === "BROKEN" ? "BROKEN" : "GOOD",
        fixedOn: fixedOn.trim() || undefined,
      }),
    onSuccess: handleSuccess,
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.create", mutationError));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!amenityId) {
        throw new Error("No amenity selected for update.");
      }

      return ownerApi.updateAmenity(amenityId, {
        name: name.trim(),
        price: Number(price),
        condition: condition === "BROKEN" ? "BROKEN" : "GOOD",
        fixedOn: fixedOn.trim() || undefined,
      });
    },
    onSuccess: handleSuccess,
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.amenities.update", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: isEditing ? "Edit Amenity" : "Create Amenity" }} />
      <Text style={styles.title}>{isEditing ? "Edit Amenity" : "Create Amenity"}</Text>
      {propertyLocked ? (
        <LabeledInput label="Property" value={selectedPropertyLabel} editable={false} />
      ) : (
        <LabeledSelect
          label="Property"
          value={selectedPropertyId}
          options={propertyOptions}
          onValueChange={setSelectedPropertyId}
          placeholder={propertiesQuery.isLoading ? "Loading properties..." : "Select property"}
        />
      )}
      <LabeledInput label="Amenity name" value={name} onChangeText={setName} />
      <LabeledInput
        label="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="0"
      />
      <LabeledSelect label="Condition" value={condition} options={CONDITION_OPTIONS} onValueChange={setCondition} />
      <LabeledDateInput label="Fixed on" value={fixedOn} onChangeText={setFixedOn} placeholder="Select fixed date" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        onPress={() => {
          if (isEditing) {
            updateMutation.mutate();
            return;
          }

          createMutation.mutate();
        }}
        loading={createMutation.isPending || updateMutation.isPending}
        disabled={!selectedPropertyId || !name.trim() || !price.trim()}
      >
        {isEditing ? "Save Amenity" : "Create Amenity"}
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  error: {
    color: "#b91c1c",
  },
});
