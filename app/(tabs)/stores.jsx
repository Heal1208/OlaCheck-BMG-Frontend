import { useEffect, useState, useCallback } from "react";
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAssignedStores } from "../../src/services/storeService";
import { getUser } from "../../src/services/authService";

const PURPLE = "#5B4FD9";
const TYPE_COLOR = {
    grocery: { bg: "#FFF3E0", text: "#F57C00" },
    supermarket: { bg: "#E8F5E9", text: "#2E7D32" },
    agency: { bg: "#E3F2FD", text: "#1565C0" },
};
const ADMIN_ROLES = ["Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"];
const SALES_ROLES = ["Sales_Executive", "Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"];

export default function StoresScreen() {
    const [stores, setStores] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => { getUser().then(setCurrentUser); }, []);
    useFocusEffect(useCallback(() => { fetchStores(); }, []));

    useEffect(() => {
        if (!search.trim()) { setFiltered(stores); return; }
        const q = search.toLowerCase();
        setFiltered(stores.filter(s =>
            s.store_name.toLowerCase().includes(q) ||
            s.district.toLowerCase().includes(q) ||
            s.owner_name.toLowerCase().includes(q)
        ));
    }, [search, stores]);

    const fetchStores = async () => {
        try {
            const r = await getAssignedStores();
            if (r.success) { setStores(r.data.stores); setFiltered(r.data.stores); }
        } finally { setLoading(false); setRefreshing(false); }
    };

    const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role);
    const isSales = currentUser && SALES_ROLES.includes(currentUser.role);

    const renderStore = ({ item }) => {
        const tc = TYPE_COLOR[item.store_type] || { bg: "#f0f0f0", text: "#666" };
        return (
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <Ionicons name="storefront-outline" size={22} color={PURPLE} />
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <Text style={styles.storeName} numberOfLines={1}>{item.store_name}</Text>
                        <View style={[styles.badge, { backgroundColor: tc.bg }]}>
                            <Text style={[styles.badgeText, { color: tc.text }]}>{item.store_type}</Text>
                        </View>
                    </View>
                    <Text style={styles.ownerName}>{item.owner_name}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={12} color="#888" />
                        <Text style={styles.infoText} numberOfLines={1}>{item.address}, {item.district}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={12} color="#888" />
                        <Text style={styles.infoText}>{item.phone}</Text>
                    </View>

                    <View style={styles.actionRow}>
                        {isSales && (
                            <TouchableOpacity
                                style={styles.checkinBtn}
                                onPress={() => router.push({
                                    pathname: "/checkins/checkin",
                                    params: { store: JSON.stringify(item) }
                                })}
                            >
                                <Ionicons name="location-outline" size={14} color="#fff" />
                                <Text style={styles.checkinBtnText}>Check In</Text>
                            </TouchableOpacity>
                        )}
                        {isAdmin && (
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => router.push({
                                    pathname: "/stores/edit",
                                    params: { store: JSON.stringify(item) }
                                })}
                            >
                                <Ionicons name="create-outline" size={14} color={PURPLE} />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PURPLE} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Stores</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push("/stores/search")}>
                        <Ionicons name="search-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    {isAdmin && (
                        <TouchableOpacity onPress={() => router.push("/stores/create")}>
                            <Ionicons name="add-circle-outline" size={26} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color="#aaa" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Filter stores..."
                    placeholderTextColor="#aaa"
                    value={search}
                    onChangeText={setSearch}
                />
                {search !== "" && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                        <Ionicons name="close-circle" size={16} color="#aaa" />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.countText}>{filtered.length} of {stores.length} stores</Text>

            <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.store_id)}
                renderItem={renderStore}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchStores(); }}
                        colors={[PURPLE]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="storefront-outline" size={48} color="#ddd" />
                        <Text style={styles.emptyText}>No stores found</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { backgroundColor: PURPLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    headerRight: { flexDirection: "row", gap: 14, alignItems: "center" },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, gap: 8 },
    searchInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: "#111" },
    countText: { fontSize: 12, color: "#888", paddingHorizontal: 16, marginBottom: 4 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#F0F0FF", alignItems: "center", justifyContent: "center" },
    cardBody: { flex: 1, gap: 3 },
    cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    storeName: { fontSize: 14, fontWeight: "700", color: "#111", flex: 1 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    ownerName: { fontSize: 12, color: "#666" },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    infoText: { fontSize: 12, color: "#888", flex: 1 },
    actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    checkinBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PURPLE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    checkinBtnText: { fontSize: 12, color: "#fff", fontWeight: "600" },
    editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0F0FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    editBtnText: { fontSize: 12, color: PURPLE, fontWeight: "600" },
    empty: { alignItems: "center", padding: 48, gap: 12 },
    emptyText: { fontSize: 14, color: "#aaa" },
});