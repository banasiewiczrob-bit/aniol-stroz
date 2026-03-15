import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackButton, useSwipeHintInset } from "@/components/BackButton";
import { CoJakSection } from "@/components/CoJakSection";
import * as Contacts from "expo-contacts";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TYPE } from "@/styles/typography";

const BG = "#061A2C";
const SUB = "rgba(226,248,245,0.9)";
const ACCENT = "#9EF3C7";
const ACCENT_BG = "rgba(158,243,199,0.22)";
const ACCENT_BORDER = "rgba(158,243,199,0.55)";
const Watermark = require("../assets/images/maly_aniol.png");
const STORAGE_KEY = "@support_contacts";
type SupportContact = { id: string; name: string; phone: string };
type DeviceContact = { id: string; name: string; phones: string[] };
type DeviceContactsPickResult = { items: DeviceContact[]; permissionDenied?: boolean };

async function pickContactsFromDevice(): Promise<DeviceContactsPickResult> {
  try {
    const available = await Contacts.isAvailableAsync();
    if (!available) {
      Alert.alert("Brak dostępu", "Na tym urządzeniu API kontaktów nie jest dostępne.");
      return { items: [] };
    }

    const currentPermission = await Contacts.getPermissionsAsync();
    const permission =
      currentPermission.status === "granted" ? currentPermission : await Contacts.requestPermissionsAsync();
    if (permission.status !== "granted") {
      return { items: [], permissionDenied: true };
    }

    const allRows: Contacts.ExistingContact[] = [];
    let pageOffset = 0;
    const pageSize = 500;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.FirstName, Contacts.Fields.LastName, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
        pageSize,
        pageOffset,
      });
      allRows.push(...(response.data ?? []));
      hasNextPage = response.hasNextPage === true;
      pageOffset += response.data?.length ?? 0;
      if (!response.hasNextPage) break;
    }

    const mapped = allRows
      .map((item) => {
        const phones = Array.isArray(item?.phoneNumbers)
          ? item.phoneNumbers
              .map((phoneItem) => (typeof phoneItem?.number === "string" ? phoneItem.number.trim() : ""))
              .filter((value: string) => value.length > 0)
          : [];
        const uniquePhones = [...new Set(phones)];
        const fullNameFromParts = [item?.firstName, item?.middleName, item?.lastName]
          .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
          .join(" ")
          .trim();
        const name = typeof item?.name === "string" && item.name.trim().length > 0 ? item.name.trim() : fullNameFromParts;
        if (!name || uniquePhones.length === 0) return null;
        return { id: String(item.id), name, phones: uniquePhones };
      })
      .filter(Boolean) as DeviceContact[];

    return { items: mapped.sort((a, b) => a.name.localeCompare(b.name, "pl", { sensitivity: "base" })) };
  } catch (e) {
    console.error("Błąd dostępu do książki adresowej:", e);
    Alert.alert(
      "Błąd kontaktów",
      "Nie udało się odczytać kontaktów z telefonu. Sprawdź uprawnienia kontaktów w ustawieniach systemu i spróbuj ponownie."
    );
    return { items: [] };
  }
}

export default function WsparcieSiatka() {
  const { swipeHintInset } = useSwipeHintInset();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [loadingDeviceContacts, setLoadingDeviceContacts] = useState(false);
  const [phonePickerOpen, setPhonePickerOpen] = useState(false);
  const [selectedDeviceContact, setSelectedDeviceContact] = useState<DeviceContact | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const sortContacts = (items: SupportContact[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name, "pl", { sensitivity: "base" }));

  const loadContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setContacts(sortContacts(JSON.parse(saved)));
    } catch (e) {
      console.error("Błąd ładowania kontaktów:", e);
    }
  };

  const saveContacts = async (items: SupportContact[]) => {
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

  const handleEdit = (item: SupportContact) => {
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

  const openDevicePicker = async () => {
    setLoadingDeviceContacts(true);
    const result = await pickContactsFromDevice();
    setLoadingDeviceContacts(false);
    if (result.permissionDenied) {
      Alert.alert(
        "Brak zgody na kontakty",
        "Aby dodać kontakt z książki adresowej, włącz dostęp do kontaktów w ustawieniach telefonu.",
        [
          { text: "Anuluj", style: "cancel" },
          {
            text: "Otwórz ustawienia",
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]
      );
      return;
    }
    const items = result.items;
    if (items.length === 0) {
      Alert.alert("Brak kontaktów", "Nie znaleziono kontaktów z numerem telefonu do dodania.");
      return;
    }
    setDeviceContacts(items);
    setDeviceQuery("");
    setPhonePickerOpen(false);
    setSelectedDeviceContact(null);
    setPickerOpen(true);
  };

  const addFromDeviceContact = async (
    candidateNameRaw: string,
    candidatePhoneRaw: string,
    deviceContactId?: string
  ) => {
    const candidateName = candidateNameRaw.trim();
    const candidatePhone = candidatePhoneRaw.trim();
    if (!candidateName || !candidatePhone) return;

    const existing = contacts.find(
      (contact) =>
        contact.name.toLowerCase() === candidateName.toLowerCase() &&
        contact.phone.replace(/\s+/g, "") === candidatePhone.replace(/\s+/g, "")
    );

    if (existing) {
      Alert.alert("Kontakt już istnieje", "Ta osoba jest już w Twojej siatce wsparcia.");
      return;
    }

    const newItem: SupportContact = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: candidateName,
      phone: candidatePhone,
    };
    const next = sortContacts([newItem, ...contacts]);
    setContacts(next);
    await saveContacts(next);
    if (deviceContactId) {
      setDeviceContacts((prev) => prev.filter((item) => item.id !== deviceContactId));
    }
  };

  const handleDeviceContactPress = async (item: DeviceContact) => {
    if (item.phones.length === 1) {
      await addFromDeviceContact(item.name, item.phones[0], item.id);
      return;
    }
    setPickerOpen(false);
    setSelectedDeviceContact(item);
    setPhonePickerOpen(true);
  };

  const filteredDeviceContacts = deviceContacts.filter((item) => {
    const q = deviceQuery.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.phones.some((phoneItem) => phoneItem.toLowerCase().includes(q));
  });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Text style={styles.title}>Siatka wsparcia</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Tu zapisujesz ludzi, do których możesz się odezwać, kiedy robi się trudniej albo kiedy po prostu nie chcesz zostać z tym sam."
          jak="Warto zrobić to wcześniej, w spokojniejszym momencie. Dzięki temu w kryzysie nie szukasz od zera, tylko sięgasz po gotowy kontakt."
        />
        <Text style={styles.subtitle}>
          Zapisz osoby, do których możesz zadzwonić w kryzysie albo wtedy, gdy potrzebujesz zwykłej rozmowy.
          Taka lista pomaga sięgnąć po kontakt, zanim napięcie zrobi się większe.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Szukaj po imieniu lub numerze"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.searchInput}
        />

        <View style={styles.form}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
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
            {!editingId && (
              <Pressable style={styles.cancelButton} onPress={openDevicePicker} disabled={loadingDeviceContacts}>
                <Text style={styles.cancelButtonText}>
                  {loadingDeviceContacts ? "Ładowanie..." : "Dodaj z kontaktów"}
                </Text>
              </Pressable>
            )}
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
                <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
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

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalCard}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          >
            <Text style={styles.modalTitle}>Dodaj z książki adresowej</Text>
            <TextInput
              value={deviceQuery}
              onChangeText={setDeviceQuery}
              placeholder="Szukaj kontaktu"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.searchInput}
            />
            <FlatList
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              data={filteredDeviceContacts}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                  <Pressable key={item.id} style={styles.modalRow} onPress={() => void handleDeviceContactPress(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowName}>{item.name}</Text>
                      <Text style={styles.modalRowPhone}>
                        {item.phones[0]}
                        {item.phones.length > 1 ? ` (+${item.phones.length - 1} num.)` : ""}
                      </Text>
                    </View>
                    <Text style={styles.modalAdd}>Dodaj</Text>
                  </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Brak kontaktów pasujących do wyszukiwania.</Text>}
            />
            <Pressable style={styles.modalClose} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={phonePickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPhonePickerOpen(false);
          setSelectedDeviceContact(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalCard}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          >
            <Text style={styles.modalTitle}>Wybierz numer telefonu</Text>
            <Text style={styles.modalHint}>{selectedDeviceContact?.name ?? ""}</Text>
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
            >
              {(selectedDeviceContact?.phones ?? []).map((phoneItem) => (
                <Pressable
                  key={phoneItem}
                  style={styles.modalRow}
                  onPress={() =>
                    void (async () => {
                      await addFromDeviceContact(
                        selectedDeviceContact?.name ?? "",
                        phoneItem,
                        selectedDeviceContact?.id
                      );
                      setPhonePickerOpen(false);
                      setSelectedDeviceContact(null);
                      setPickerOpen(true);
                    })()
                  }
                >
                  <Text style={styles.modalRowName}>{phoneItem}</Text>
                  <Text style={styles.modalAdd}>Wybierz</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.modalClose}
              onPress={() => {
                setPhonePickerOpen(false);
                setSelectedDeviceContact(null);
              }}
            >
              <Text style={styles.modalCloseText}>Anuluj</Text>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(158,243,199,0.1)",
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(126,200,255,0.09)",
    bottom: 110,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40, position: "relative" },
  title: { ...TYPE.h1, color: "white", marginBottom: 14 },
  subtitle: { ...TYPE.body, color: SUB, marginBottom: 18 },
  searchInput: {
    backgroundColor: "rgba(7, 24, 38, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    ...TYPE.body,
    marginBottom: 12,
  },
  form: {
    backgroundColor: "rgba(12,38,62,0.78)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
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
    borderColor: ACCENT_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    ...TYPE.body,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: ACCENT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flex: 1,
  },
  addButtonText: { ...TYPE.button, color: "white" },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.7)" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,10,20,0.72)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "rgba(12,38,62,0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 14,
    maxHeight: "84%",
  },
  modalTitle: { ...TYPE.bodyStrong, color: "white", marginBottom: 10 },
  modalHint: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.72)", marginBottom: 6 },
  modalList: { marginTop: 2 },
  modalListContent: { gap: 8, paddingBottom: 8 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(7,24,38,0.55)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(158,243,199,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalRowName: { ...TYPE.bodyStrong, color: "white" },
  modalRowPhone: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  modalAdd: { ...TYPE.caption, color: ACCENT },
  modalClose: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(158,243,199,0.16)",
  },
  modalCloseText: { ...TYPE.bodySmall, color: "white" },
  list: { gap: 12 },
  emptyText: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.5)" },
  card: {
    backgroundColor: "rgba(12,38,62,0.78)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  cardWatermark: {
    position: "absolute",
    right: -18,
    bottom: -22,
    width: 120,
    height: 120,
    opacity: 0.11,
    tintColor: "white",
    transform: [{ rotate: "16deg" }],
  },
  cardName: { ...TYPE.bodyStrong, color: "white" },
  cardPhone: { ...TYPE.bodySmall, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  actions: { marginLeft: 12, alignItems: "flex-end", gap: 8 },
  callButton: {
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  callButtonText: { ...TYPE.caption, color: "white" },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editButtonText: { ...TYPE.caption, color: ACCENT },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: { ...TYPE.caption, color: "rgba(255,255,255,0.6)" },
});
