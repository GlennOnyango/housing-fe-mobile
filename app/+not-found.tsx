import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/screen";

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Route not found</Text>
        <Text style={styles.copy}>The requested screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          Go to app root
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  copy: {
    color: "#475569",
  },
  link: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
});
