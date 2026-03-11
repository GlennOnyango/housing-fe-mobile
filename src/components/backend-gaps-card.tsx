import { StyleSheet, Text, View } from "react-native";

import { backendGaps } from "@/src/constants/backend-gaps";

export function BackendGapsCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Blocked by Backend Gaps</Text>
      {backendGaps.map((gap) => (
        <View key={gap.id} style={styles.item}>
          <Text style={styles.itemTitle}>{gap.title}</Text>
          <Text style={styles.endpoint}>{gap.missingEndpoint}</Text>
          <Text style={styles.copy}>{gap.recommendation}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  title: {
    color: "#9a3412",
    fontWeight: "700",
    fontSize: 16,
  },
  item: {
    gap: 2,
    paddingTop: 4,
  },
  itemTitle: {
    color: "#7c2d12",
    fontWeight: "600",
  },
  endpoint: {
    color: "#b45309",
    fontSize: 12,
  },
  copy: {
    color: "#9a3412",
    fontSize: 12,
  },
});
