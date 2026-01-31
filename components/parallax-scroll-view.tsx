import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
  headerImage?: React.ReactNode;
  headerBackgroundColor?: { dark: string; light: string };
};

export default function ParallaxScrollView({ children, headerImage }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {headerImage ? <View style={styles.header}>{headerImage}</View> : null}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  header: { height: 220, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 18, paddingTop: 14 },
});