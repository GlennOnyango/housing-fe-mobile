import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { ownerApi } from "@/src/api/services";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

async function loadServicesByProperty() {
  const properties = await ownerApi.listProperties({ page: 1, pageSize: 100 });
  const servicesByProperty = await Promise.all(
    properties.items.map(async (property) => {
      const services = await ownerApi.listServiceProviders(property.id, undefined, {
        page: 1,
        pageSize: 100,
      });

      return {
        property,
        services: services.items,
      };
    }),
  );

  return servicesByProperty;
}

export default function OwnerServiceProvidersScreen() {
  const servicesQuery = useQuery({
    queryKey: ["owner", "service-providers", "all-properties"],
    queryFn: loadServicesByProperty,
  });

  const totalProviders =
    servicesQuery.data?.reduce((sum, entry) => sum + entry.services.length, 0) ?? 0;
  const propertyCount = servicesQuery.data?.length ?? 0;

  return (
    <Screen>
      <Text style={styles.title}>Service providers</Text>
      <Text style={styles.copy}>
        Service providers are now managed per property. Use the property service pages to add or update contacts.
      </Text>

      {servicesQuery.isLoading ? <Text style={styles.copy}>Loading service providers...</Text> : null}
      {servicesQuery.isError ? (
        <Text style={styles.error}>{problemToMessage(normalizeApiError(servicesQuery.error))}</Text>
      ) : null}

      {!servicesQuery.isLoading && !servicesQuery.isError ? (
        <SectionCard
          title="Portfolio overview"
          subtitle={`${totalProviders} provider${totalProviders === 1 ? "" : "s"} across ${propertyCount} propert${propertyCount === 1 ? "y" : "ies"}`}
        >
          {(servicesQuery.data ?? []).map(({ property, services }) => (
            <View key={property.id} style={styles.propertyGroup}>
              <View style={styles.propertyHeader}>
                <View style={styles.propertyMeta}>
                  <Text style={styles.propertyName}>{property.name}</Text>
                  <Text style={styles.propertyCount}>
                    {services.length} provider{services.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/owner/properties/${property.id}/services`)}
                >
                  <Text style={styles.link}>Manage</Text>
                </Pressable>
              </View>

              {services.length ? (
                services.map((service) => (
                  <View key={service.id} style={styles.serviceRow}>
                    <View style={styles.serviceMeta}>
                      <Text style={styles.serviceName}>{service.providerName}</Text>
                      <Text style={styles.serviceCopy}>{service.category}</Text>
                    </View>
                    <Text style={styles.serviceCopy}>{service.providerPhone || "No phone"}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>No providers added yet.</Text>
              )}
            </View>
          ))}
        </SectionCard>
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
  copy: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
  propertyGroup: {
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  propertyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  propertyMeta: {
    gap: 2,
    flex: 1,
  },
  propertyName: {
    color: "#0f172a",
    fontWeight: "700",
  },
  propertyCount: {
    color: "#64748b",
    fontSize: 12,
  },
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  serviceRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  serviceMeta: {
    gap: 2,
  },
  serviceName: {
    color: "#0f172a",
    fontWeight: "600",
  },
  serviceCopy: {
    color: "#475569",
  },
  empty: {
    color: "#64748b",
  },
});
