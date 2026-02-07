import { Image, StyleSheet, View } from "react-native";

type AngelMarkProps = {
  size?: number;
  opacity?: number;
};

export default function AngelMark({
  size = 48,
  opacity = 0.08,
}: AngelMarkProps) {
  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}>
      <Image
        source={require('../assets/images/maly_aniol.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
});
