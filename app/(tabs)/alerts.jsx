import { useState, useCallback } from "react";
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAlerts, resolveAlert } from "../../src/services/checkinService";

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

const ALERT_TYPE = {
    low_stock: { color: "#E65100", bg: "#FFF3E0", icon: "warning-outline", label: "Low Stock" },
    near_expiry: { color: "#6A1B9A", bg: "#F3E5F5", icon: "time-outline", label: "Near Expiry" },
};

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("0");

    useFocusEffect(useCallback(() => { fetchAlerts(); }, []));

    const fetchAlerts = async () => {
        try {
            const r = await getAlerts({ is_resolved: filter });
            if (r.success) setAlerts(r.data.alerts);
        } finally { setLoading(false); setRefreshing(false); }
    };

    const handleResolve = (item) => {
        showAlert(
            "Resolve Alert",
            `Mark this ${item.alert_type.replace("_", " ")} alert for "${item.product_name}" at ${item.store_name} as resolved?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Resolve", style: "destructive",
                    onPress: async () => {
                        const r = await resolveAlert(item.alert_id);
                        if (r.success) fetchAlerts();
                        else showAlert("Failed", r.message);
                    }
                }
            ]
        );
    };

    const renderAlert = ({ item }) => {
        const type = ALERT_TYPE[item.alert_type] || ALERT_TYPE.low_stock;
        return (
            <View style={styles.card}>
                <View style={[styles.alertIcon, { backgroundColor: type.bg }]}>
                    <Ionicons name={type.icon} size={22} color={type.color} />
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
                            <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.storeName}>
                        <Ionicons name="storefront-outline" size={12} color="#888" /> {item.store_name}
                    </Text>
                    <Text style={styles.storeAddr}>{item.district}, {item.city}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="cube-outline" size={12} color="#888" />
                            <Text style={styles.metaText}>Qty: {item.quantity_at_alert}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="alert-circle-outline" size={12} color="#888" />
                            <Text style={styles.metaText}>Threshold: {item.low_stock_threshold}</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    {item.is_resolved ? (
                        <View style={styles.resolvedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color="#27AE60" />
                            <Text style={styles.resolvedText}>
                                Resolved by {item.resolved_by_name}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item)}>
                            <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Alerts</Text>
                {alerts.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{alerts.length}</Text>
                    </View>
                )}
            </View>

            <View style={styles.filterRow}>
                {[
                    { label: "Unresolved", value: "0" },
                    { label: "Resolved", value: "1" },
                ].map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
                        onPress={() => { setFilter(f.value); setLoading(true); setTimeout(fetchAlerts, 0); }}
                    >
                        <Text style={[styles.filterBtnText, filter === f.value && styles.filterBtnTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading
                ? <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>
                : (
                    <FlatList
                        data={alerts}
                        keyExtractor={(item) => String(item.alert_id)}
                        renderItem={renderAlert}
                        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
                                colors={[GOLD]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#ddd" />
                                <Text style={styles.emptyText}>
                                    {filter === "0" ? "No active alerts" : "No resolved alerts"}
                                </Text>
                            </View>
                        }
                    />
                )
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { backgroundColor: GOLD, flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    countBadge: { backgroundColor: "#E53935", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    countBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
    filterRow: { flexDirection: "row", backgroundColor: "#fff", padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f4f4f4", alignItems: "center" },
    filterBtnActive: { backgroundColor: GOLD },
    filterBtnText: { fontSize: 13, color: "#666", fontWeight: "600" },
    filterBtnTextActive: { color: "#fff" },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12 },
    alertIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    cardBody: { flex: 1, gap: 4 },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    productName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
    typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    typeBadgeText: { fontSize: 11, fontWeight: "600" },
    storeName: { fontSize: 13, color: "#444", fontWeight: "500" },
    storeAddr: { fontSize: 12, color: "#888" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 11, color: "#888" },
    dateText: { fontSize: 11, color: "#aaa", marginLeft: "auto" },
    resolvedBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    resolvedText: { fontSize: 12, color: "#27AE60", fontWeight: "600" },
    resolveBtn: { marginTop: 8, backgroundColor: "#FFF3E0", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
    resolveBtnText: { fontSize: 13, color: "#E65100", fontWeight: "700" },
    empty: { alignItems: "center", padding: 48, gap: 12 },
    emptyText: { fontSize: 14, color: "#aaa" },
});