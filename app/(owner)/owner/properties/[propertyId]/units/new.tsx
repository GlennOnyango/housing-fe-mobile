import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const optionalNumber = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length ? Number(value) : undefined))
  .refine((value) => value === undefined || Number.isFinite(value), "Must be a number.");

const requiredNumber = z
  .string()
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), "Must be a number.")
  .refine((value) => value >= 0, "Must be 0 or greater.");

const schema = z.object({
  unitLabel: z.string().min(1, "Unit label is required."),
  floor: optionalNumber,
  rent: requiredNumber,
  deposit: requiredNumber,
  serviceCharge: requiredNumber,
});

type FormValue = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function NewUnitScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { control, handleSubmit } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      unitLabel: "",
      floor: "",
      rent: "",
      deposit: "",
      serviceCharge: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => ownerApi.createUnit(propertyId, payload),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["owner", "units", propertyId] });
      router.replace(`/owner/properties/${propertyId}/units`);
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("owner.units.create", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Add unit</Text>
      <Controller
        control={control}
        name="unitLabel"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Unit label"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="floor"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Floor (optional)"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="rent"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Rent"
            value={field.value?.toString() ?? ""}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="deposit"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Deposit"
            value={field.value?.toString() ?? ""}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="serviceCharge"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Service charge"
            value={field.value?.toString() ?? ""}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Create unit
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
