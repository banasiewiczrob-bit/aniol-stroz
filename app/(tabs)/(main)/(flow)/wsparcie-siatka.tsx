import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackButton } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { TYPE } from "@/styles/typography";

const BG = "#071826";
const SUB = "rgba(255,255,255,0.7)";
const STORAGE_KEY = "@support_contacts";

export default function WsparcieSiatka() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const sortContacts = (items: Array<{ id: string; name: string; phone: string }>) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name, "pl", { sensitivity: "base" }));

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setContacts(sortContacts(JSON.parse(saved)));
    } catch (e) {
      console.error("Błąd ładowania kontaktów:", e);
    }
  };

  const saveContacts = async (items: Array<{ id: string; name: string; phone: string }>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortContacts(items)));
    } catch (e) {
      console.error("Błąd zapisu kontaktów:", e);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEditingId(null);
  };

  const handleAddOrSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      Alert.alert("Uzupełnij dane", "Wpisz imię/nazwę oraz numer telefonu.");
      return;
    }

    if (editingId) {
      const next = contacts.map((item) =>
        item.id === editingId ? { ...item, name: trimmedName, phone: trimmedPhone } : item
      );
      const sorted = sortContacts(next);
      setContacts(sorted);
      await saveContacts(sorted);
      resetForm();
      return;
    }

    const newItem = { id: `${Date.now()}`, name: trimmedName, phone: trimmedPhone };
    const next = sortContacts([newItem, ...contacts]);
    setContacts(next);
    await saveContacts(next);
    resetForm();
  };

  const handleEdit = (item: { id: string; name: string; phone: string }) => {
    setEditingId(item.id);
    setName(item.name);
    setPhone(item.phone);
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Usunąć kontakt?", "Tego nie da się cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: async () => {
          const next = contacts.filter((item) => item.id !== id);
          setContacts(next);
          await saveContacts(next);
          if (editingId === id) resetForm();
        },
      },
    ]);
  };

  const handleCall = async (rawPhone: string) => {
    const normalized = rawPhone.replace(/[^\d+]/g, "");
    const url = `tel:${normalized}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Nie można zadzwonić", "Twój telefon nie obsługuje połączeń z tej aplikacji.");
      return;
    }
    Linking.openURL(url);
  };

  return (
    <View style={styles.screen}>
      <BackButton />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Siatka wsparcia</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Tu budujesz listę osób, do których możesz zadzwonić w trudniejszym momencie."
          jak="Dodaj kontakty wcześniej, zanim pojawi się kryzys. Aktualizuj numery i utrzymuj listę pod ręką."
        />
        <Text style={styles.subtitle}>
          Zapisz osoby, do których możesz zadzwonić w kryzysie, albo po prostu pogadać. 
          Zbuduj swoją siatkę wsparcia. W ten sposób łatwiej będzie Ci sięgnąć po pomoc, 
          gdy znajdziesz się w potrzebie.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Szukaj po imieniu lub numerze"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.searchInput}
        />

        <View style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Imię, nazwisko lub pseudonim"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Numer telefonu"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <View style={styles.formActions}>
            <Pressable style={styles.addButton} onPress={handleAddOrSave}>
              <Text style={styles.addButtonText}>
                {editingId ? "Zapisz zmiany" : "Dodaj kontakt"}
              </Text>
            </Pressable>
            {editingId && (
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.list}>
          {contacts.filter((item) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q);
          }).length === 0 ? (
            <Text style={styles.emptyText}>Na razie brak zapisanych kontaktów.</Text>
          ) : (
            contacts
              .filter((item) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return item.name.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q);
              })
              .map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPhone}>{item.phone}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable style={styles.callButton} onPress={() => handleCall(item.phone)}>
                    <Text style={styles.callButtonText}>Zadzwoń</Text>
                  </Pressable>
                  <Pressable style={styles.editButton} onPress={() => handleEdit(item)}>
                    <Text style={styles.editButtonText}>Edytuj</Text>
                  </Pressable>
                  <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Usuń</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  subtitle: { ...TYPE.body, color: SUB, marginBottom: 18 },
  searchInput: {
    backgroundColor: "rgba(7, 24, 38, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    ...TYPE.body,
    marginBottom: 12,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.12)",
    padding: 16,
    marginBottom: 20,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    backgroundColor: "rgba(7, 24, 38, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    ...TYPE.body,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "rgba(120, 200, 255, 0.25)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#78C8FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
  },
  addButtonText: { ...TYPE.button, color: "white" },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.7)" },
  list: { gap: 12 },
  emptyText: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.5)" },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(120, 200, 255, 0.15)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardName: { ...TYPE.bodyStrong, color: "white" },
  cardPhone: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  actions: { marginLeft: 12, alignItems: "flex-end", gap: 8 },
  callButton: {
    backgroundColor: "#3b5998",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  callButtonText: { ...TYPE.caption, color: "white" },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editButtonText: { ...TYPE.caption, color: "rgba(120, 200, 255, 0.9)" },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: { ...TYPE.caption, color: "rgba(255,255,255,0.6)" },
});
