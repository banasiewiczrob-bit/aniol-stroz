import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#0B1B2B";
const STORAGE_KEY = "startDateISO";

function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatPL(d: Date) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function yearsMonthsDays(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return { years: 0, months: 0, days: 0 };
  return { years, months, days };
}

export default function CounterScreen() {
  const [startDate, setStartDate] = useState<Date>(new Date(1997, 2, 10));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(new Date(1997, 2, 10));

  const today = new Date();

  const totalDays = useMemo(() => diffDays(startDate, today), [startDate]);
  const ymd = useMemo(() => yearsMonthsDays(startDate, today), [startDate]);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setStartDate(new Date(saved));
    })();
  }, []);

  const openPicker = () => {
    setDraftDate(startDate);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: startDate,
        mode: "date",
        is24Hour: true,
        onChange: async (_event, selected) => {
          if (!selected) return;
          setStartDate(selected);
          await AsyncStorage.setItem(STORAGE_KEY, selected.toISOString());
        },
      });
      return;
    }

    setPickerOpen(true);
  };

  const saveDraft = async () => {
    setStartDate(draftDate);
    await AsyncStorage.setItem(STORAGE_KEY, draftDate.toISOString());
    setPickerOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* TREŚĆ */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          transform: [{ translateY: -24 }],
        }}
      >
        {/* delikatny nagłówek (nie nawigacyjny) */}
        <Text
          style={{
            color: "rgba(255,255,255,0.50)",
            fontSize: 12,
            fontWeight: "900",
            letterSpacing: 2.2,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Właśnie dzisiaj
        </Text>

        {/* tytuł */}
        <Text
          style={{
            color: "rgba(255,255,255,0.96)",
            fontSize: 34,
            fontWeight: "900",
            textAlign: "center",
            lineHeight: 38,
            marginBottom: 50,
          }}
        >
          Mój licznik{"\n"}zdrowienia
        </Text>

        {/* liczba + dni w jednej linii */}
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center" }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.96)",
              fontSize: 62,
              fontWeight: "900",
              letterSpacing: 1,
            }}
          >
            {totalDays}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 22,
              fontWeight: "800",
              marginLeft: 14,
            }}
          >
            dni
          </Text>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 18, marginTop: 8 }}>
          od {formatPL(startDate)}
        </Text>

        {/* Zdrowieję już: w osobnej linii */}
        <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 18, marginTop: 44 }}>
          Zdrowieję już:
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 20, marginTop: 10, textAlign: "center" }}>
          {ymd.years} lat • {ymd.months} miesięcy • {ymd.days} dni
        </Text>

        {/* przycisk */}
        <Pressable
          onPress={openPicker}
          style={{
            marginTop: 64,
            paddingVertical: 14,
            paddingHorizontal: 22,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
            backgroundColor: "rgba(255,255,255,0.06)",
            minWidth: 280,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
            Ustaw datę przebudzenia
          </Text>
        </Pressable>
      </View>

      {/* iOS picker */}
      {Platform.OS === "ios" && pickerOpen ? (
        <View
          style={{
            padding: 14,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "#071422",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, fontWeight: "800" }}>Anuluj</Text>
            </Pressable>
            <Pressable onPress={saveDraft} hitSlop={10}>
              <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 16, fontWeight: "900" }}>Zapisz</Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={draftDate}
            mode="date"
            display="spinner"
            onChange={(_e, d) => d && setDraftDate(d)}
            themeVariant="dark"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}