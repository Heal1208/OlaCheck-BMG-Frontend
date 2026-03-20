import { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, Platform, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    getStockEntries, createExpiryRecord, completeCheckin,
} from "../../src/services/checkinService";

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

export default function ExpiryScreen() {
    const { check_id, store_name } = useLocalSearchParams();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [forms, setForms] = useState({});

    useEffect(() => {
        getStockEntries(parseInt(check_id)).then((r) => {
            if (r.success) {
                setEntries(r.data);
                const init = {};
                r.data.forEach(e => {
                    init[e.entry_id] = {
                        batch_code: "",
                        production_date: "",
                        expiry_date: "",
                        quantity: String(e.quantity_on_shelf || ""),
                    };
                });
                setForms(init);
            }
            setLoading(false);
        });
    }, []);

    const setField = (entryId, key, val) => {
        setForms(prev => ({
            ...prev,
            [entryId]: { ...prev[entryId], [key]: val }
        }));
    };

    const handleSaveExpiry = async (entry) => {
        const f = forms[entry.entry_id];
        if (!f.batch_code || !f.production_date || !f.expiry_date || !f.quantity) {
            showAlert("Error", "Please fill in all expiry fields."); return;
        }
        setSaving(true);
        try {
            const r = await createExpiryRecord(entry.entry_id, {
                batch_code: f.batch_code,
                production_date: f.production_date,
                expiry_date: f.expiry_date,
                quantity: parseInt(f.quantity),
            });
            if (r.success) {
                const msg = r.data.is_near_expiry
                    ? `⚠ Near expiry! Only ${r.data.days_left} days left.`
                    : `✓ Saved. ${r.data.days_left} days until expiry.`;
                showAlert("Expiry Recorded", msg);
                setExpanded(null);
            } else {
                showAlert("Failed", r.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setSaving(false); }
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            const r = await completeCheckin(parseInt(check_id));
            if (r.success) {
                showAlert("Visit Complete!", "Check-in has been completed successfully.", [
                    { text: "Done", onPress: () => router.replace("/(tabs)/stores") }
                ]);
            } else {
                showAlert("Failed", r.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setSaving(false); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PURPLE} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Expiry Check</Text>
                    <Text style={styles.headerSub}>{store_name}</Text>
                </View>
                <View style={{ width: 22 }} />
            </View>

            <View style={styles.progressBar}>
                <View style={styles.step}>
                    <Ionicons name="checkmark-circle" size={20} color={PURPLE} />
                    <Text style={styles.stepTextDone}>Check-in</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: PURPLE }]} />
                <View style={styles.step}>
                    <Ionicons name="checkmark-circle" size={20} color={PURPLE} />
                    <Text style={styles.stepTextDone}>Stock</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: PURPLE }]} />
                <View style={styles.step}>
                    <View style={styles.stepCircleActive}>
                        <Text style={styles.stepCircleText}>3</Text>
                    </View>
                    <Text style={styles.stepTextActive}>Expiry</Text>
                </View>
            </View>

            <Text style={styles.hint}>
                Tap a product to record its expiry date. This step is optional.
            </Text>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                {entries.map((entry) => (
                    <View key={entry.entry_id} style={styles.entryCard}>
                        <TouchableOpacity
                            style={styles.entryHeader}
                            onPress={() => setExpanded(expanded === entry.entry_id ? null : entry.entry_id)}
                        >
                            <View style={styles.entryLeft}>
                                <View style={styles.entryIcon}>
                                    <Ionicons name="cube-outline" size={18} color={PURPLE} />
                                </View>
                                <View>
                                    <Text style={styles.entryName}>{entry.product_name}</Text>
                                    <Text style={styles.entrySku}>{entry.sku} · {entry.quantity_on_shelf} {entry.unit}</Text>
                                </View>
                            </View>
                            <Ionicons
                                name={expanded === entry.entry_id ? "chevron-up" : "chevron-down"}
                                size={18} color="#aaa"
                            />
                        </TouchableOpacity>

                        {expanded === entry.entry_id && (
                            <View style={styles.expiryForm}>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Batch Code</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="e.g. LOT-2025-001"
                                        placeholderTextColor="#aaa"
                                        value={forms[entry.entry_id]?.batch_code}
                                        onChangeText={(v) => setField(entry.entry_id, "batch_code", v)}
                                    />
                                </View>
                                <View style={styles.dateRow}>
                                    <View style={[styles.formField, { flex: 1 }]}>
                                        <Text style={styles.formLabel}>Production Date</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#aaa"
                                            value={forms[entry.entry_id]?.production_date}
                                            onChangeText={(v) => setField(entry.entry_id, "production_date", v)}
                                        />
                                    </View>
                                    <View style={[styles.formField, { flex: 1 }]}>
                                        <Text style={styles.formLabel}>Expiry Date</Text>
                                        <TextInput
                                            style={styles.formInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#aaa"
                                            value={forms[entry.entry_id]?.expiry_date}
                                            onChangeText={(v) => setField(entry.entry_id, "expiry_date", v)}
                                        />
                                    </View>
                                </View>
                                <View style={styles.formField}>
                                    <Text style={styles.formLabel}>Quantity in this batch</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="0"
                                        placeholderTextColor="#aaa"
                                        value={forms[entry.entry_id]?.quantity}
                                        onChangeText={(v) => setField(entry.entry_id, "quantity", v)}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.saveExpiryBtn, saving && { opacity: 0.7 }]}
                                    onPress={() => handleSaveExpiry(entry)}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.saveExpiryBtnText}>Save Expiry Record</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}

                {entries.length === 0 && (
                    <View style={styles.empty}>
                        <Ionicons name="cube-outline" size={48} color="#ddd" />
                        <Text style={styles.emptyText}>No stock entries found</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeBtn, saving && { opacity: 0.7 }]}
                    onPress={handleComplete}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.completeBtnText}>Complete Visit</Text>
                        </>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { backgroundColor: PURPLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 12, color: "#ffffff99", marginTop: 2 },
    progressBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    step: { alignItems: "center", gap: 2 },
    stepLine: { flex: 1, height: 2, backgroundColor: "#e0e0e0", marginHorizontal: 8 },
    stepTextDone: { fontSize: 10, color: PURPLE, fontWeight: "600" },
    stepTextActive: { fontSize: 10, color: PURPLE, fontWeight: "700" },
    stepCircleActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" },
    stepCircleText: { fontSize: 12, color: "#fff", fontWeight: "700" },
    hint: { fontSize: 12, color: "#888", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    entryCard: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 10, overflow: "hidden" },
    entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
    entryLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    entryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0F0FF", alignItems: "center", justifyContent: "center" },
    entryName: { fontSize: 14, fontWeight: "700", color: "#111" },
    entrySku: { fontSize: 12, color: "#888", marginTop: 2 },
    expiryForm: { padding: 14, paddingTop: 0, gap: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
    formField: { gap: 6 },
    formLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
    formInput: { backgroundColor: "#f4f4f4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111" },
    dateRow: { flexDirection: "row", gap: 10 },
    saveExpiryBtn: { backgroundColor: PURPLE, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
    saveExpiryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    empty: { alignItems: "center", padding: 48, gap: 12 },
    emptyText: { fontSize: 14, color: "#aaa" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
    completeBtn: { backgroundColor: "#27AE60", borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    completeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});