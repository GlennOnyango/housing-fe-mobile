import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { messageFromLoggedApiError } from "@/src/api/problem";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { useSession } from "@/src/auth/session-context";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password should be at least 8 characters."),
});

type FormValue = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { control, handleSubmit } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: FormValue) => {
      await login(payload);
    },
    onSuccess: () => {
      setError(null);
      router.replace("/");
    },
    onError: (mutationError) => {
      setError(messageFromLoggedApiError("auth.login", mutationError));
    },
  });

  const onSubmit = handleSubmit((payload) => {
    loginMutation.mutate(payload);
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.copy}>
          Sign in with your owner or tenant account. Role routing happens automatically.
        </Text>
      </View>

      <SectionCard title="Sign in" subtitle="Use your account credentials to continue.">
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
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              error={fieldState.error?.message}
              rightElement={
                <Pressable
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#475569"
                  />
                </Pressable>
              }
            />
          )}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton onPress={onSubmit} loading={loginMutation.isPending}>
          Sign in
        </PrimaryButton>

        <PrimaryButton tone="light" onPress={() => router.push("/onboarding")}>
          Claim invite
        </PrimaryButton>
      </SectionCard>

      <View style={styles.links}>
        <Link href="/auth/register-owner" style={styles.link}>
          Register owner account
        </Link>
        <Link href="/auth/request-magic-link" style={styles.link}>
          Request magic link
        </Link>
        <Link href="/auth/consume-magic-link" style={styles.link}>
          Consume magic link
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
    marginBottom: 8,
  },
  links: {
    gap: 8,
    marginTop: 4,
  },
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  error: {
    color: "#b91c1c",
  },
});
