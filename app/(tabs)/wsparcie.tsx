import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function WsparcieScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sekcja Wsparcie</Text>
      <Text style={styles.subtext}>Tutaj pojawią się Twoje materiały pomocowe.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071826', justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  subtext: { color: 'rgba(255,255,255,0.6)', marginTop: 10 }
});