import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator color="#0f172a" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  label: {
    color: "#334155",
  },
});
