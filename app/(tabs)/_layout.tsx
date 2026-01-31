import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "DOM" }} />
      <Tabs.Screen name="licznik" options={{ title: "Licznik" }} />
      <Tabs.Screen name="dzienniki" options={{ title: "Dzienniki" }} />

      {/* te dwa na razie mogą być ukryte albo zostawione */}
      <Tabs.Screen name="plan-dnia" options={{ title: "Plan dnia" }} />
      <Tabs.Screen name="wsparcie" options={{ title: "Wsparcie" }} />

      {/* jeśli explore.tsx jest tylko ze startera – wyłączamy */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}