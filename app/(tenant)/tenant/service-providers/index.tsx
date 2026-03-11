import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { tenantApi } from "@/src/api/services";
import { LabeledInput } from "@/src/components/labeled-input";
import { PrimaryButton } from "@/src/components/primary-button";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

function normalizePhone(phone?: string) {
  if (!phone) {
    return "";
  }

  return phone.replace(/[^\d+]/g, "");
}

export default function TenantServiceProvidersScreen() {
  const [category, setCategory] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  const providersQuery = useQuery({
    queryKey: ["tenant", "providers", searchCategory],
    queryFn: () => tenantApi.listServiceProviders(searchCategory || undefined),
  });

  return (
    <Screen>
      <Text style={styles.title}>Service providers</Text>
      <LabeledInput label="Category filter" value={category} onChangeText={setCategory} />
      <PrimaryButton onPress={() => setSearchCategory(category)} tone="light">
        Apply filter
      </PrimaryButton>

      {providersQuery.isLoading ? <Text>Loading providers...</Text> : null}
      {providersQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(providersQuery.error))}</Text>
      ) : null}

      {(providersQuery.data?.items ?? []).map((provider) => (
        <SectionCard key={provider.id} title={provider.name} subtitle={provider.category}>
          {provider.phone ? (
            <Pressable
              onPress={() => void Linking.openURL(`tel:${normalizePhone(provider.phone)}`)}
            >
              <Text style={styles.link}>Call {provider.phone}</Text>
            </Pressable>
          ) : null}
          {provider.whatsapp || provider.phone ? (
            <Pressable
              onPress={() =>
                void Linking.openURL(
                  `https://wa.me/${normalizePhone(provider.whatsapp ?? provider.phone)}`,
                )
              }
            >
              <Text style={styles.link}>Open WhatsApp</Text>
            </Pressable>
          ) : null}
          {!provider.phone && !provider.whatsapp ? (
            <Text style={styles.muted}>No phone contacts available.</Text>
          ) : null}
        </SectionCard>
      ))}

      {!providersQuery.data?.items.length && !providersQuery.isLoading ? (
        <View>
          <Text style={styles.muted}>No providers found for this filter.</Text>
        </View>
      ) : null}
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
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  muted: {
    color: "#64748b",
  },
});
