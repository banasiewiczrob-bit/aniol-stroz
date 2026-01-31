import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function Collapsible({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={{ borderRadius: 14, overflow: "hidden" }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "800" }}>
          {title} {open ? "▾" : "▸"}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}