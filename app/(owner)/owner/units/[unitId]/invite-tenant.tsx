import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email.").or(z.literal("")),
    phone: z.string().trim().or(z.literal("")),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: "Provide at least email or phone.",
    path: ["email"],
  });

type FormValue = z.infer<typeof schema>;

export default function InviteTenantScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) =>
      ownerApi.inviteTenant(unitId, {
        email: payload.email || undefined,
        phone: payload.phone || undefined,
      }),
    onSuccess: (result) => {
      setError(null);
      setMessage(`Invite token issued: ${result.token}`);
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("owner.invite-tenant", mutationError));
    },
  });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Invite Tenant" }} />
      <Text style={styles.title}>Invite Tenant</Text>
      <Text style={styles.copy}>Unit ID: {unitId}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Tenant email (optional)"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Tenant phone (optional)"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="phone-pad"
            error={fieldState.error?.message}
          />
        )}
      />

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Invite Tenant
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
