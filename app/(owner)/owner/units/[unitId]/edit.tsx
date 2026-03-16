import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { UnitStatus } from "@/src/api/generated";
import { Stack, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { LabeledSelect } from "@/src/components/labeled-select";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const optionalNumber = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length ? Number(value) : undefined))
  .refine((value) => value === undefined || Number.isFinite(value), "Must be a number.");

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value && value.trim().length ? value.trim() : undefined));

const schema = z.object({
  unitLabel: optionalText,
  floor: optionalNumber,
  status: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length ? (value as UnitStatus) : undefined)),
  rent: optionalNumber,
  deposit: optionalNumber,
  serviceCharge: optionalNumber,
  effectiveAt: optionalText,
});

type FormValue = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function UnitEditScreen() {
  const params = useLocalSearchParams<{
    unitId: string;
    unitLabel?: string;
    floor?: string;
    status?: string;
    rent?: string;
    deposit?: string;
    serviceCharge?: string;
  }>();
  const { unitId } = params;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { control, handleSubmit, watch } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      unitLabel: params.unitLabel ?? "",
      floor: params.floor ?? "",
      status: params.status ?? "",
      rent: params.rent ?? "",
      deposit: params.deposit ?? "",
      serviceCharge: params.serviceCharge ?? "",
      effectiveAt: "",
    },
  });
  const unitLabel = watch("unitLabel");

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => ownerApi.updateUnit(unitId, payload),
    onSuccess: () => {
      setError(null);
      setSuccess("Unit updated.");
    },
    onError: (mutationError) => {
      setSuccess(null);
      setError(messageFromLoggedApiError("owner.units.update", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: unitLabel || params.unitLabel || "Edit Unit" }} />
      <Text style={styles.title}>{unitLabel || params.unitLabel || "Edit Unit"}</Text>
      <Text style={styles.copy}>Update unit details using backend-aligned fields.</Text>
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
            label="Floor"
            value={field.value?.toString() ?? ""}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <>
            <LabeledSelect
              label="Status"
              value={field.value ?? ""}
              onValueChange={field.onChange}
              options={[
                { label: "Available", value: "AVAILABLE" },
                { label: "Occupied", value: "OCCUPIED" },
                { label: "Maintenance", value: "MAINTENANCE" },
              ]}
            />
            {fieldState.error?.message ? <Text style={styles.error}>{fieldState.error.message}</Text> : null}
          </>
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
      <Controller
        control={control}
        name="effectiveAt"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Effective at (ISO-8601, optional)"
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />

      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Update unit
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
