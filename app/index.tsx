import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

const BG = "#071826";

export default function Intro() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BG,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 36,
          fontWeight: "900",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Witaj.
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 18,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        Jestem Anioł Stróż.  
        Poprowadzę Cię przez Twój proces.
      </Text>

      <Pressable
        onPress={() => router.replace("/dom")}
        style={{
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 999,
          backgroundColor: "rgba(120,200,255,0.25)",
          borderWidth: 1,
          borderColor: "rgba(120,200,255,0.6)",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Dalej
        </Text>
      </Pressable>
    </View>
  );
}