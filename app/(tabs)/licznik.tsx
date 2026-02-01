import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LicznikScreen() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [daysPassed, setDaysPassed] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedDate = await AsyncStorage.getItem('startDate');
      if (savedDate) {
        const d = new Date(savedDate);
        setDate(d);
        calculateDays(d);
      }
    } catch (e) { console.error('Błąd ładowania:', e); }
  };

  const calculateDays = (startDate: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysPassed(diffDays);
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
    calculateDays(currentDate);
    saveData(currentDate);
  };

  const saveData = async (d: Date) => {
    try { await AsyncStorage.setItem('startDate', d.toISOString()); } 
    catch (e) { console.error('Błąd zapisu:', e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Twój Licznik zdrowienia</Text>
        
        <View style={styles.counterBox}>
          {/* Zmniejszona czcionka do 48, by pasowała do dużych liczb */}
          <Text style={styles.number}>{daysPassed}</Text>
          <Text style={styles.label}>dni pod opieką Anioła Stróża</Text>
        </View>

        <Pressable style={styles.button} onPress={() => setShow(true)}>
          <Text style={styles.buttonText}>Ustaw datę początkową</Text>
        </Pressable>

        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChange}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  counterBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  number: {
    fontSize: 40, // Optymalny rozmiar dla liczb 5-cyfrowych
    fontWeight: 'bold',
    color: '#007AFF',
  },
  label: { fontSize: 16, color: '#666', marginTop: 10 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});