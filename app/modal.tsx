import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Modal</ThemedText>

      <ThemedView style={styles.separator} />

      <Link href="/" style={styles.link}>
        <ThemedText type="link">Zamknij</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  separator: {
    marginVertical: 16,
    height: 1,
    width: "100%",
  },
  link: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
});