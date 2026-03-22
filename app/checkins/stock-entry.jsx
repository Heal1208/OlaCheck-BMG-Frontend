import { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, Platform, TextInput, FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    getProducts, createStockEntries, completeCheckin,
} from "../../src/services/checkinService";

const GOLD = "#C8960C";

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

export default function StockEntryScreen() {
    const { check_id, store_name } = useLocalSearchParams();

    const [products, setProducts] = useState([]);
    const [entries, setEntries] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lowStock, setLowStock] = useState([]);

    useEffect(() => {
        getProducts().then((r) => {
            if (r.success) {
                setProducts(r.data);
                const init = {};
                r.data.forEach(p => { init[p.product_id] = ""; });
                setEntries(init);
            }
            setLoading(false);
        });
    }, []);

    const setQty = (productId, val) => {
        setEntries(prev => ({ ...prev, [productId]: val }));
    };

    const handleSave = async () => {
        const filled = Object.entries(entries)
            .filter(([, qty]) => qty !== "" && qty !== null)
            .map(([product_id, qty]) => ({
                product_id: parseInt(product_id),
                quantity_on_shelf: parseInt(qty) || 0,
            }));

        if (filled.length === 0) {
            showAlert("Error", "Please enter at least one product quantity."); return;
        }

        setSaving(true);
        try {
            const r = await createStockEntries(parseInt(check_id), filled);
            if (r.success) {
                const alerts = r.data.low_stock_alerts || [];
                setLowStock(alerts);

                if (alerts.length > 0) {
                    const names = alerts.map(a => `• ${a.product_name} (${a.quantity} left)`).join("\n");
                    showAlert(
                        "⚠ Low Stock Detected",
                        `${r.message}\n\nAlerts created for:\n${names}`,
                        [{
                            text: "Continue to Expiry Check", onPress: () => router.push({
                                pathname: "/checkins/expiry",
                                params: { check_id, store_name }
                            })
                        }]
                    );
                } else {
                    showAlert("Saved", r.message, [
                        {
                            text: "Check Expiry Dates", onPress: () => router.push({
                                pathname: "/checkins/expiry",
                                params: { check_id, store_name }
                            })
                        },
                    ]);
                }
            } else {
                showAlert("Failed", r.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setSaving(false); }
    };

    const handleComplete = async () => {
        showAlert(
            "Complete Check-in",
            "Skip expiry check and complete this visit?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete", style: "destructive",
                    onPress: async () => {
                        const r = await completeCheckin(parseInt(check_id));
                        if (r.success) {
                            showAlert("Done", "Check-in completed.", [
                                { text: "OK", onPress: () => router.replace("/(tabs)/stores") }
                            ]);
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Stock Entry</Text>
                    <Text style={styles.headerSub}>{store_name}</Text>
                </View>
                <View style={{ width: 22 }} />
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.step, styles.stepDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.stepTextDone}>Check-in</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.step, styles.stepActive]}>
                    <Text style={styles.stepTextActive}>2</Text>
                    <Text style={styles.stepTextActive}>Stock</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <Text style={styles.stepNum}>3</Text>
                    <Text style={styles.stepText}>Expiry</Text>
                </View>
            </View>

            {products.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="cube-outline" size={48} color="#ddd" />
                    <Text style={styles.emptyText}>No products found</Text>
                    <Text style={styles.emptyHint}>Ask admin to add products first</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => String(item.product_id)}
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    renderItem={({ item }) => {
                        const qty = entries[item.product_id];
                        const isLow = qty !== "" && parseInt(qty) < item.low_stock_threshold;
                        return (
                            <View style={[styles.productCard, isLow && styles.productCardLow]}>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.product_name}</Text>
                                    <Text style={styles.productSku}>{item.sku} · {item.unit}</Text>
                                    <Text style={styles.threshold}>
                                        Alert threshold: {item.low_stock_threshold}
                                    </Text>
                                </View>
                                <View style={styles.qtyWrap}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => {
                                            const cur = parseInt(qty) || 0;
                                            if (cur > 0) setQty(item.product_id, String(cur - 1));
                                        }}
                                    >
                                        <Ionicons name="remove" size={18} color={GOLD} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.qtyInput, isLow && styles.qtyInputLow]}
                                        value={String(qty)}
                                        onChangeText={(v) => setQty(item.product_id, v.replace(/[^0-9]/g, ""))}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                        placeholderTextColor="#ccc"
                                    />
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => {
                                            const cur = parseInt(qty) || 0;
                                            setQty(item.product_id, String(cur + 1));
                                        }}
                                    >
                                        <Ionicons name="add" size={18} color={GOLD} />
                                    </TouchableOpacity>
                                </View>
                                {isLow && (
                                    <View style={styles.lowBadge}>
                                        <Ionicons name="warning-outline" size={12} color="#E65100" />
                                        <Text style={styles.lowBadgeText}>Low Stock</Text>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.skipBtn} onPress={handleComplete}>
                    <Text style={styles.skipBtnText}>Skip & Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Text style={styles.saveBtnText}>Save & Next</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
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
    header: { backgroundColor: GOLD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 12, color: "#ffffff99", marginTop: 2 },
    progressBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    step: { alignItems: "center", gap: 2 },
    stepDone: {},
    stepActive: {},
    stepLine: { flex: 1, height: 2, backgroundColor: "#e0e0e0", marginHorizontal: 8 },
    stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#e0e0e0", textAlign: "center", lineHeight: 24, fontSize: 12, color: "#999", fontWeight: "700" },
    stepText: { fontSize: 10, color: "#999" },
    stepTextDone: { fontSize: 10, color: GOLD, fontWeight: "600" },
    stepTextActive: { fontSize: 10, color: GOLD, fontWeight: "700" },
    productCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
    productCardLow: { borderWidth: 1.5, borderColor: "#FF8A65" },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: "700", color: "#111" },
    productSku: { fontSize: 12, color: "#888", marginTop: 2 },
    threshold: { fontSize: 11, color: "#aaa", marginTop: 2 },
    qtyWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center" },
    qtyInput: { width: 52, height: 40, backgroundColor: "#f4f4f4", borderRadius: 8, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#111" },
    qtyInputLow: { backgroundColor: "#FFF3E0", color: "#E65100" },
    lowBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF3E0", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    lowBadgeText: { fontSize: 10, color: "#E65100", fontWeight: "600" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: { fontSize: 16, fontWeight: "600", color: "#aaa" },
    emptyHint: { fontSize: 13, color: "#ccc" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 12, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
    skipBtn: { flex: 1, borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
    skipBtnText: { fontSize: 14, color: "#666", fontWeight: "600" },
    saveBtn: { flex: 2, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});