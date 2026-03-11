import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { useSession } from "@/src/auth/session-context";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password should be at least 8 characters."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  orgName: z.string().min(1, "Org name is required."),
});

type FormValue = z.infer<typeof schema>;

export default function RegisterOwnerScreen() {
  const { registerOwner } = useSession();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      orgName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: FormValue) => {
      await registerOwner(payload);
    },
    onSuccess: () => {
      setError(null);
      router.replace("/");
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("auth.register-owner", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Register owner</Text>
      <Text style={styles.copy}>Creates owner account and starts session bootstrap.</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="First name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Last name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="orgName"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Org name"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="none"
            keyboardType="email-address"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <LabeledInput
            label="Password"
            value={field.value}
            onChangeText={field.onChange}
            secureTextEntry
            autoCapitalize="none"
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        onPress={handleSubmit((payload) => registerMutation.mutate(payload))}
        loading={registerMutation.isPending}
      >
        Register
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
  error: {
    color: "#b91c1c",
  },
});
