import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { useSession } from "@/src/auth/session-context";
import { CooldownText } from "@/src/components/cooldown-text";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
});

type FormValue = z.infer<typeof schema>;

export default function RequestMagicLinkScreen() {
  const { requestMagicLink } = useSession();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormValue) => {
      await requestMagicLink(payload);
    },
    onSuccess: () => {
      setError(null);
      setMessage("If the account exists, a magic link has been sent.");
    },
    onError: (mutationError) => {
      setMessage(null);
      setError(messageFromLoggedApiError("auth.request-magic-link", mutationError));
    },
  });

  return (
    <Screen>
      <Text style={styles.title}>Request magic link</Text>
      <Text style={styles.copy}>Used for tenant and passwordless owner login.</Text>

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

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CooldownText cooldownKey="auth.request-magic-link" />

      <PrimaryButton
        onPress={handleSubmit((payload) => mutation.mutate(payload))}
        loading={mutation.isPending}
      >
        Send magic link
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
