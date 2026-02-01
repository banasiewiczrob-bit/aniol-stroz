import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#071826";
const ACCENT = "#78C8FF";

// Ścieżka zakłada, że folder assets jest w folderze app
const Watermark = require("../assets/images/maly_aniol.png");

export default function LicznikScreen() {
  const [startDate, setStartDate] = useState(new Date());
  const [days, setDays] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const calculateDays = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const difference = today.getTime() - start.getTime();
    const totalDays = Math.floor(difference / (1000 * 3600 * 24));
    setDays(totalDays >= 0 ? totalDays : 0);
  };

  useEffect(() => { calculateDays(startDate); }, [startDate]);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={Watermark} style={styles.watermark} />
      <View style={styles.content}>
        <Text style={styles.label}>Trwasz w zdrowieniu już</Text>
        <View style={styles.counterCircle}>
          <Text style={styles.daysNumber}>{days}</Text>
          <Text style={styles.daysText}>{days === 1 ? "DZIEŃ" : "DNI"}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.dateLabel}>Data rozpoczęcia:</Text>
          <Text style={styles.dateValue}>{startDate.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}</Text>
          <Pressable onPress={() => setShowPicker(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Zmień datę startu</Text>
          </Pressable>
        </View>
        {showPicker && (
          <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onChange} maximumDate={new Date()} themeVariant="dark" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  watermark: { position: "absolute", right: -20, top: 40, width: 250, height: 250, opacity: 0.03, resizeMode: "contain" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 18, marginBottom: 30 },
  counterCircle: { width: 240, height: 240, borderRadius: 120, borderWidth: 2, borderColor: "rgba(120,200,255,0.3)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  daysNumber: { color: "#fff", fontSize: 80, fontWeight: "800" },
  daysText: { color: ACCENT, fontSize: 18, fontWeight: "600", letterSpacing: 4 },
  infoBox: { marginTop: 40, alignItems: "center" },
  dateLabel: { color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 5 },
  dateValue: { color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: "500", marginBottom: 20 },
  editButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: "rgba(120,200,255,0.5)", backgroundColor: "rgba(120,200,255,0.1)" },
  editButtonText: { color: ACCENT, fontSize: 14, fontWeight: "600" },
});