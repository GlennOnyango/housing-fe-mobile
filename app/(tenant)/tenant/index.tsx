import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Buffer } from "buffer";

import { tenantApi } from "@/src/api/services";
import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { useSession } from "@/src/auth/session-context";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

const TENANT_ROUTES = [
  { href: "/tenant/leases", title: "Lease", icon: "document-text-outline" },
  { href: "/tenant/invoices", title: "Invoices", icon: "receipt-outline" },
  { href: "/tenant/notices", title: "Notices", icon: "notifications-outline" },
  { href: "/tenant/tickets/new", title: "Tickets", icon: "chatbubbles-outline" },
  {
    href: "/tenant/service-providers",
    title: "Services",
    icon: "construct-outline",
  },
  { href: "/tenant/security", title: "Security settings", icon: "shield-checkmark-outline" },
  { href: "/tenant/public-invoice", title: "Secure invoice token", icon: "key-outline" },
] as const;

function decodeTenantName(accessToken: string | null) {
  if (!accessToken) {
    return null;
  }

  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payloadPart.padEnd(payloadPart.length + ((4 - (payloadPart.length % 4)) % 4), "=");
    const decodedPayload = typeof globalThis.atob === "function"
      ? globalThis.atob(paddedPayload)
      : Buffer.from(paddedPayload, "base64").toString("utf8");
    const payload = JSON.parse(decodedPayload) as Record<string, unknown>;

    const nameFromClaims =
      (typeof payload.name === "string" && payload.name.trim()) ||
      (typeof payload.fullName === "string" && payload.fullName.trim()) ||
      [
        typeof payload.firstName === "string" ? payload.firstName.trim() : "",
        typeof payload.lastName === "string" ? payload.lastName.trim() : "",
      ]
        .filter(Boolean)
        .join(" ");

    if (nameFromClaims) {
      return nameFromClaims;
    }

    if (typeof payload.email === "string" && payload.email.includes("@")) {
      return payload.email.split("@")[0];
    }
  } catch {
    return null;
  }

  return null;
}

export default function TenantDashboardScreen() {
  const { session } = useSession();
  const tenantName = decodeTenantName(session.accessToken) || session.userId?.trim() || "Tenant";

  const balanceQuery = useQuery({
    queryKey: ["tenant", "balance"],
    queryFn: () => tenantApi.getBalance(),
  });

  const invoicesQuery = useQuery({
    queryKey: ["tenant", "invoices", "latest"],
    queryFn: () => tenantApi.listInvoices({ page: 1, pageSize: 1 }),
  });

  const noticesQuery = useQuery({
    queryKey: ["tenant", "notices", "latest"],
    queryFn: () => tenantApi.listNotices({ page: 1, pageSize: 1 }),
  });

  const leaseHistoryQuery = useQuery({
    queryKey: ["tenant", "leases", "history", "count"],
    queryFn: () => tenantApi.getLeaseHistory({ page: 1, pageSize: 1 }),
  });

  const counts = {
    lease: leaseHistoryQuery.data?.total ?? 0,
    invoices: invoicesQuery.data?.total ?? 0,
    notices: noticesQuery.data?.total ?? 0,
    tickets: 0,
    services: 0,
    security: 1,
    secureInvoiceToken: 1,
  };

  return (
    <Screen>
      <Text style={styles.title}>Welcome {tenantName}</Text>
      <Text style={styles.copy}>Access your tenant services and recent account activity.</Text>

      <SectionCard title="Workspace">
        <View style={styles.grid}>
          {TENANT_ROUTES.map((route) => (
            <Pressable
              key={route.href}
              accessibilityRole="button"
              onPress={() => router.push(route.href as never)}
              style={styles.card}
            >
              <Ionicons name={route.icon} size={22} color="#1d4ed8" />
              <Text style={styles.cardCount}>
                {route.href === "/tenant/leases"
                  ? counts.lease
                  : route.href === "/tenant/invoices"
                  ? counts.invoices
                  : route.href === "/tenant/notices"
                    ? counts.notices
                    : route.href === "/tenant/tickets/new"
                      ? counts.tickets
                      : route.href === "/tenant/service-providers"
                        ? counts.services
                        : route.href === "/tenant/security"
                          ? counts.security
                          : counts.secureInvoiceToken}
              </Text>
              <Text style={styles.cardTitle}>{route.title}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Recent overview">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Balance</Text>
            {balanceQuery.isError ? (
              <Text style={styles.error}>
                {problemToMessage(normalizeApiError(balanceQuery.error))}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>
                {balanceQuery.data
                  ? `${balanceQuery.data.amount} ${balanceQuery.data.currency}`
                  : "Loading..."}
              </Text>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Latest invoice</Text>
            {invoicesQuery.isError ? (
              <Text style={styles.error}>
                {problemToMessage(normalizeApiError(invoicesQuery.error))}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>
                {invoicesQuery.data?.items[0]
                  ? `${invoicesQuery.data.items[0].total} for ${invoicesQuery.data.items[0].period}`
                  : "No invoice yet."}
              </Text>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Recent notice</Text>
            {noticesQuery.isError ? (
              <Text style={styles.error}>
                {problemToMessage(normalizeApiError(noticesQuery.error))}
              </Text>
            ) : (
              <Text style={styles.summaryValue}>
                {noticesQuery.data?.items[0]?.title ?? "No notices yet."}
              </Text>
            )}
          </View>
        </ScrollView>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "600",
  },
  cardCount: {
    color: "#1e293b",
    fontSize: 24,
    fontWeight: "700",
  },
  summaryRow: {
    gap: 10,
    paddingRight: 6,
  },
  summaryCard: {
    width: 220,
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  summaryTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#0f172a",
    fontWeight: "600",
  },
  error: {
    color: "#b91c1c",
  },
});
