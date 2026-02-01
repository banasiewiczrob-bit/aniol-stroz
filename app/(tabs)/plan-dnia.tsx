import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PlanScreen() {
  const [task, setTask] = useState('');
  const [isDone, setIsDone] = useState(false);

  // Ładowanie zapisanego zadania przy starcie
  useEffect(() => {
    loadTask();
  }, []);

  const saveTask = async (value: string, status: boolean) => {
    try {
      await AsyncStorage.setItem('@daily_task', JSON.stringify({ text: value, done: status }));
    } catch (e) {
      console.error("Błąd zapisu", e);
    }
  };

  const loadTask = async () => {
    try {
      const saved = await AsyncStorage.getItem('@daily_task');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        setTask(parsed.text);
        setIsDone(parsed.done);
      }
    } catch (e) {
      console.error("Błąd odczytu", e);
    }
  };

  const handleToggleDone = () => {
    const newStatus = !isDone;
    setIsDone(newStatus);
    saveTask(task, newStatus);
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Plan dnia</Text>
        
        <View style={styles.card}>
          <Text style={styles.subtitle}>JEDNA RZECZ NA TERAZ:</Text>
          
          <TextInput
            style={[styles.input, isDone && styles.inputDone]}
            placeholder="Wpisz swoje zadanie..."
            placeholderTextColor="#666"
            value={task}
            onChangeText={(txt) => {
              setTask(txt);
              saveTask(txt, isDone);
            }}
            multiline
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <TouchableOpacity 
            style={[styles.checkButton, isDone && styles.checkButtonDone]} 
            onPress={handleToggleDone}
          >
            <Ionicons 
              name={isDone ? "checkmark-circle" : "ellipse-outline"} 
              size={32} 
              color={isDone ? "#78C8FF" : "#D1D1D1"} 
            />
            <Text style={[styles.buttonText, isDone && styles.buttonTextDone]}>
              {isDone ? "Zrobione!" : "Oznacz jako wykonane"}
            </Text>
          </TouchableOpacity>
        </View>

        {isDone && (
          <Text style={styles.congrats}>Dobra robota! Odpocznij teraz. 🙌</Text>
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 30 },
  card: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
  },
  subtitle: { color: '#78C8FF', fontSize: 12, fontWeight: '800', marginBottom: 15, letterSpacing: 1 },
  input: { 
    fontSize: 22, 
    color: '#D1D1D1', // Jasnoszary tekst
    lineHeight: 30,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputDone: { 
    textDecorationLine: 'line-through', 
    color: 'rgba(209, 209, 209, 0.4)' 
  },
  checkButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: { color: '#D1D1D1', marginLeft: 10, fontSize: 16 },
  buttonTextDone: { color: '#78C8FF', fontWeight: 'bold' },
  congrats: { color: '#78C8FF', textAlign: 'center', marginTop: 30, fontSize: 16, fontStyle: 'italic' }
});