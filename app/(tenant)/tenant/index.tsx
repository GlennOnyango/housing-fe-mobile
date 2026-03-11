import { Link } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { tenantApi } from "@/src/api/services";
import { normalizeApiError, problemToMessage } from "@/src/api/problem";
import { useSession } from "@/src/auth/session-context";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";

export default function TenantDashboardScreen() {
  const { logout } = useSession();

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
    queryFn: () => tenantApi.listNotices({ page: 1, pageSize: 5 }),
  });

  return (
    <Screen>
      <Text style={styles.title}>Tenant dashboard</Text>

      <SectionCard title="Balance">
        {balanceQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(balanceQuery.error))}</Text>
        ) : (
          <Text style={styles.metric}>
            {balanceQuery.data ? `${balanceQuery.data.amount} ${balanceQuery.data.currency}` : "Loading..."}
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Latest invoice">
        {invoicesQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(invoicesQuery.error))}</Text>
        ) : (
          <Text style={styles.metric}>
            {invoicesQuery.data?.items[0]
              ? `${invoicesQuery.data.items[0].amountDue} due ${invoicesQuery.data.items[0].dueDate}`
              : "No invoice yet."}
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Recent notices">
        {noticesQuery.isError ? (
          <Text style={styles.error}>{problemToMessage(normalizeApiError(noticesQuery.error))}</Text>
        ) : (
          noticesQuery.data?.items.map((item) => (
            <Text key={item.id} style={styles.notice}>
              • {item.title}
            </Text>
          ))
        )}
      </SectionCard>

      <SectionCard title="Tenant portal">
        <Link href="/tenant/invoices" style={styles.link}>
          Invoices
        </Link>
        <Link href="/tenant/notices" style={styles.link}>
          Notices
        </Link>
        <Link href="/tenant/tickets/new" style={styles.link}>
          Create ticket
        </Link>
        <Link href="/tenant/service-providers" style={styles.link}>
          Service directory
        </Link>
        <Link href="/tenant/public-invoice" style={styles.link}>
          View secure invoice token
        </Link>
        <Link href="/tenant/security" style={styles.link}>
          Security settings
        </Link>
      </SectionCard>

      <Pressable onPress={() => void logout()}>
        <Text style={styles.logout}>Logout</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  metric: {
    color: "#0f172a",
    fontWeight: "600",
  },
  notice: {
    color: "#334155",
  },
  error: {
    color: "#b91c1c",
  },
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  logout: {
    color: "#b91c1c",
    fontWeight: "600",
  },
});
