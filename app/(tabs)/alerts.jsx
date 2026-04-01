import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import { getAlerts, resolveAlert } from "../../src/services/checkinService";

const GOLD = "#C8960C";
const ALERT_TYPE = {
    low_stock: { color: "#E65100", bg: "#FFF3E0", icon: "warning-outline", label: "Low Stock" },
    near_expiry: { color: "#6A1B9A", bg: "#F3E5F5", icon: "time-outline", label: "Near Expiry" },
};

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("0"); // "0" = unresolved, "1" = resolved
    const { alertConfig, showAlert, hideAlert } = useAlert();

    // Fetch khi màn hình được focus
    useFocusEffect(useCallback(() => {
        fetchAlerts("0");
        setFilter("0");
    }, []));

    // Re-fetch mỗi khi filter thay đổi
    useEffect(() => {
        fetchAlerts(filter);
    }, [filter]);

    const fetchAlerts = async (resolvedValue) => {
        setLoading(true);
        try {
            const r = await getAlerts({ is_resolved: resolvedValue });
            if (r.success) {
                setAlerts(r.data.alerts);
            } else {
                setAlerts([]);
            }
        } catch {
            setAlerts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFilterChange = (val) => {
        if (val === filter) return; // tránh re-fetch không cần thiết
        setFilter(val);
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
                        try {
                            const r = await resolveAlert(item.alert_id);
                            if (r.success) {
                                fetchAlerts(filter);
                            } else {
                                showAlert("Failed", r.message);
                            }
                        } catch {
                            showAlert("Error", "Cannot connect to server.");
                        }
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
                    <Text style={styles.storeName}>{item.store_name}</Text>
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
                            {new Date(item.created_at).toLocaleDateString("vi-VN")}
                        </Text>
                    </View>
                    {item.is_resolved ? (
                        <View style={styles.resolvedBadge}>
                            <Ionicons name="checkmark-circle" size={13} color="#27AE60" />
                            <Text style={styles.resolvedText}>
                                Resolved{item.resolved_by_name ? ` by ${item.resolved_by_name}` : ""}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item)}>
                            <Ionicons name="checkmark-outline" size={14} color="#E65100" />
                            <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const FILTERS = [
        { label: "Chưa xử lý", value: "0" },
        { label: "Đã xử lý", value: "1" },
    ];

    return (
        <View style={styles.container}>
            <AlertBox config={alertConfig} onHide={hideAlert} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Alerts</Text>
                {filter === "0" && alerts.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{alerts.length}</Text>
                    </View>
                )}
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
                        onPress={() => handleFilterChange(f.value)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterBtnText, filter === f.value && styles.filterBtnTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={GOLD} />
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => String(item.alert_id)}
                    renderItem={renderAlert}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchAlerts(filter);
                            }}
                            colors={[GOLD]}
                            tintColor={GOLD}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons
                                name={filter === "0" ? "checkmark-circle-outline" : "time-outline"}
                                size={48}
                                color="#ddd"
                            />
                            <Text style={styles.emptyText}>
                                {filter === "0" ? "Không có cảnh báo nào" : "Chưa có cảnh báo đã xử lý"}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        backgroundColor: GOLD, flexDirection: "row", alignItems: "center",
        gap: 10, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    countBadge: { backgroundColor: "#E53935", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    countBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },

    filterRow: {
        flexDirection: "row", backgroundColor: "#fff",
        padding: 10, gap: 10,
        borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    },
    filterBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 20,
        backgroundColor: "#f4f4f4", alignItems: "center",
    },
    filterBtnActive: { backgroundColor: GOLD },
    filterBtnText: { fontSize: 13, color: "#666", fontWeight: "600" },
    filterBtnTextActive: { color: "#fff" },

    card: {
        backgroundColor: "#fff", borderRadius: 16, padding: 14,
        marginBottom: 10, flexDirection: "row", gap: 12,
    },
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
    resolveBtn: {
        marginTop: 8, backgroundColor: "#FFF3E0", borderRadius: 8,
        paddingVertical: 8, paddingHorizontal: 12,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    },
    resolveBtnText: { fontSize: 13, color: "#E65100", fontWeight: "700" },
    empty: { alignItems: "center", padding: 48, gap: 12 },
    emptyText: { fontSize: 14, color: "#aaa" },
});