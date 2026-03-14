import { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createStaff, getRoles } from "../../src/services/staffService";

const PURPLE = "#5B4FD9";

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

export default function CreateStaffScreen() {
    const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role_id: null });
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    useEffect(() => {
        getRoles().then((r) => { if (r.success) setRoles(r.data); });
    }, []);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleCreate = async () => {
        if (!form.full_name || !form.email || !form.phone || !form.password || !form.role_id) {
            showAlert("Error", "Please fill in all fields."); return;
        }
        if (form.password.length < 8) {
            showAlert("Error", "Password must be at least 8 characters."); return;
        }
        setLoading(true);
        try {
            const r = await createStaff(form);
            if (r.success) {
                showAlert("Success", "Staff account created.", [
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
                    <Text style={styles.headerTitle}>Create Staff Account</Text>
                    <View style={{ width: 22 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {[
                        { key: "full_name", label: "Full Name", placeholder: "Enter full name", keyboard: "default" },
                        { key: "email", label: "Email", placeholder: "Enter email", keyboard: "email-address" },
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
                                keyboardType={f.keyboard}
                                autoCapitalize="none"
                            />
                        </View>
                    ))}

                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.pwRow}>
                            <TextInput
                                style={styles.pwInput}
                                placeholder="Minimum 8 characters"
                                placeholderTextColor="#aaa"
                                value={form.password}
                                onChangeText={(v) => set("password", v)}
                                secureTextEntry={!showPw}
                            />
                            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                                <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={18} color="#aaa" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.roleGrid}>
                            {roles.map((r) => (
                                <TouchableOpacity
                                    key={r.role_id}
                                    style={[styles.roleBtn, form.role_id === r.role_id && styles.roleBtnActive]}
                                    onPress={() => set("role_id", r.role_id)}
                                >
                                    <Text style={[styles.roleBtnText, form.role_id === r.role_id && styles.roleBtnTextActive]}>
                                        {r.role_name.replace("_", " ")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, loading && { opacity: 0.7 }]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Account</Text>}
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
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 8 },
    input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#111" },
    pwRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16 },
    pwInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#111" },
    roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    roleBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e0e0e0" },
    roleBtnActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    roleBtnText: { fontSize: 13, color: "#666" },
    roleBtnTextActive: { color: "#fff", fontWeight: "600" },
    createBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8 },
    createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});