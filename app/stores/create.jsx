import { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createStore } from "../../src/services/storeService";
import { getStaffList } from "../../src/services/staffService";

const PURPLE = "#5B4FD9";
const STORE_TYPES = ["grocery", "supermarket", "agency"];

const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
        const msg = `${title}\n\n${message}`;
        if (buttons && buttons.length > 1) {
            const confirmed = window.confirm(msg);
            if (confirmed) {
                const btn = buttons.find(b => b.style === "destructive" || b.text === "OK");
                btn?.onPress?.();
            }
        } else {
            window.alert(msg);
            buttons?.[0]?.onPress?.();
        }
    } else {
        Alert.alert(title, message, buttons);
    }
};

export default function CreateStoreScreen() {
    const [form, setForm] = useState({
        store_name: "", store_type: "", owner_name: "",
        phone: "", address: "", district: "", city: "",
        assigned_staff_id: null,
    });
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getStaffList({ is_active: "1" }).then((r) => {
            if (r.success) setStaffList(r.data.staff);
        });
    }, []);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleCreate = async () => {
        const required = ["store_name", "store_type", "owner_name", "phone", "address", "district", "city"];
        const missing = required.filter((f) => !form[f]);
        if (missing.length > 0) {
            showAlert("Error", `Please fill in: ${missing.join(", ")}`); return;
        }
        if (!form.assigned_staff_id) {
            showAlert("Error", "Please select assigned staff."); return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                latitude: 0,
                longitude: 0,
            };
            const r = await createStore(payload);
            if (r.success) {
                showAlert("Success", "Store created successfully.", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                showAlert("Failed", r.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Store</Text>
                    <View style={{ width: 22 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.sectionLabel}>STORE INFO</Text>
                    {[
                        { key: "store_name", label: "Store Name", placeholder: "Enter store name" },
                        { key: "owner_name", label: "Owner Name", placeholder: "Enter owner name" },
                        { key: "phone", label: "Phone", placeholder: "Enter phone number", keyboard: "phone-pad" },
                    ].map((f) => (
                        <View key={f.key} style={styles.field}>
                            <Text style={styles.label}>{f.label}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={f.placeholder}
                                placeholderTextColor="#aaa"
                                value={form[f.key]}
                                onChangeText={(v) => set(f.key, v)}
                                keyboardType={f.keyboard || "default"}
                            />
                        </View>
                    ))}

                    <View style={styles.field}>
                        <Text style={styles.label}>Store Type</Text>
                        <View style={styles.typeRow}>
                            {STORE_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeBtn, form.store_type === t && styles.typeBtnActive]}
                                    onPress={() => set("store_type", t)}
                                >
                                    <Text style={[styles.typeBtnText, form.store_type === t && styles.typeBtnTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Text style={styles.sectionLabel}>LOCATION</Text>
                    {[
                        { key: "address", label: "Address", placeholder: "Enter street address" },
                        { key: "district", label: "District", placeholder: "Enter district" },
                        { key: "city", label: "City", placeholder: "Enter city" },
                    ].map((f) => (
                        <View key={f.key} style={styles.field}>
                            <Text style={styles.label}>{f.label}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={f.placeholder}
                                placeholderTextColor="#aaa"
                                value={form[f.key]}
                                onChangeText={(v) => set(f.key, v)}
                            />
                        </View>
                    ))}

                    <Text style={styles.sectionLabel}>ASSIGNED STAFF</Text>
                    <View style={styles.staffGrid}>
                        {staffList
                            .filter(s => ["Sales_Executive", "Sales_Admin"].includes(s.role_name))
                            .map((s) => (
                                <TouchableOpacity
                                    key={s.user_id}
                                    style={[styles.staffBtn, form.assigned_staff_id === s.user_id && styles.staffBtnActive]}
                                    onPress={() => set("assigned_staff_id", s.user_id)}
                                >
                                    <Text style={[styles.staffBtnText, form.assigned_staff_id === s.user_id && styles.staffBtnTextActive]}>
                                        {s.full_name}
                                    </Text>
                                    <Text style={[styles.staffBtnRole, form.assigned_staff_id === s.user_id && { color: "#ffffff99" }]}>
                                        {s.role_name.replace("_", " ")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        {staffList.filter(s => ["Sales_Executive", "Sales_Admin"].includes(s.role_name)).length === 0 && (
                            <Text style={styles.noStaff}>No Sales staff available</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, loading && { opacity: 0.7 }]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Store</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: { backgroundColor: PURPLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    scroll: { padding: 20, paddingBottom: 40 },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1, marginBottom: 12, marginTop: 8 },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
    input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#111" },
    typeRow: { flexDirection: "row", gap: 8 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e0e0e0", alignItems: "center" },
    typeBtnActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    typeBtnText: { fontSize: 13, color: "#666", textTransform: "capitalize" },
    typeBtnTextActive: { color: "#fff", fontWeight: "600" },
    staffGrid: { gap: 8, marginBottom: 20 },
    staffBtn: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: "#e0e0e0" },
    staffBtnActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    staffBtnText: { fontSize: 14, fontWeight: "600", color: "#111" },
    staffBtnTextActive: { color: "#fff" },
    staffBtnRole: { fontSize: 12, color: "#888", marginTop: 2 },
    noStaff: { fontSize: 13, color: "#aaa", textAlign: "center", padding: 16 },
    createBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8 },
    createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});