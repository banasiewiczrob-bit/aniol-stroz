import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TYPE } from '@/styles/typography';

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
  text: { ...TYPE.h2, color: 'white' },
  subtext: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.6)', marginTop: 10 }
});
