import { Text, StyleSheet } from "react-native";

interface ErrorTextProps {
  message: string | null | undefined;
}

export function ErrorText({ message }: ErrorTextProps) {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    color: "#b91c1c",
    fontSize: 13,
  },
});
