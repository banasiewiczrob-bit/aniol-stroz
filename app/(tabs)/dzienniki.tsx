import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

function Item({ title, href }: { title: string; href: string }) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={{
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(120,120,140,0.35)",
        backgroundColor: "rgba(255,255,255,0.06)",
        marginTop: 12,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

export default function Dzienniki() {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Dzienniki</Text>
      <Text style={{ marginTop: 6, opacity: 0.75 }}>
        Wybierz dziennik. Historia jest w środku.
      </Text>

      <Item title="Dziennik uczuć" href="/(tabs)/dzienniki/uczucia" />
      <Item title="Dziennik głodu / kryzysu" href="/(tabs)/dzienniki/glod-kryzys" />
      <Item title="Dziennik wdzięczności" href="/(tabs)/dzienniki/wdziecznosc" />
    </View>
  );
}