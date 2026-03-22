import { useState } from "react";
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchStores } from "../../src/services/storeService";

const GOLD = "#C8960C";
const TYPES = ["", "grocery", "supermarket", "agency"];

export default function StoreSearchScreen() {
    const [keyword, setKeyword] = useState("");
    const [district, setDistrict] = useState("");
    const [city, setCity] = useState("");
    const [type, setType] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        const params = {};
        if (keyword.trim()) params.q = keyword.trim();
        if (district.trim()) params.district = district.trim();
        if (city.trim()) params.city = city.trim();
        if (type) params.store_type = type;
        if (!Object.keys(params).length) return;

        setLoading(true);
        setSearched(true);
        try {
            const r = await searchStores(params);
            setResults(r.success ? r.data.stores : []);
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store Search</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.searchRow}>
                    <Ionicons name="search-outline" size={18} color="#888" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Store name, address, owner, phone..."
                        placeholderTextColor="#aaa"
                        value={keyword}
                        onChangeText={setKeyword}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    {keyword !== "" && (
                        <TouchableOpacity onPress={() => setKeyword("")}>
                            <Ionicons name="close-circle" size={18} color="#aaa" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="District" placeholderTextColor="#aaa" value={district} onChangeText={setDistrict} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="City" placeholderTextColor="#aaa" value={city} onChangeText={setCity} />
                </View>

                <View style={styles.typeRow}>
                    {TYPES.map((t) => (
                        <TouchableOpacity key={t} style={[styles.typeBtn, type === t && styles.typeBtnActive]} onPress={() => setType(t)}>
                            <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                                {t === "" ? "All" : t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Ionicons name="search-outline" size={18} color="#fff" />
                    <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 32 }} />}

                {!loading && searched && (
                    <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? "s" : ""} found</Text>
                )}

                {!loading && results.map((item) => (
                    <View key={item.store_id} style={styles.card}>
                        <View style={styles.iconBox}>
                            <Ionicons name="storefront-outline" size={20} color={GOLD} />
                        </View>
                        <View style={styles.info}>
                            <Text style={styles.name} numberOfLines={1}>{item.store_name}</Text>
                            <Text style={styles.sub}>{item.owner_name} · {item.phone}</Text>
                            <Text style={styles.addr} numberOfLines={1}>{item.address}, {item.district}, {item.city}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.store_type}</Text>
                        </View>
                    </View>
                ))}

                {!loading && searched && results.length === 0 && (
                    <View style={styles.empty}>
                        <Ionicons name="search-outline" size={40} color="#ddd" />
                        <Text style={styles.emptyText}>No stores found</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: { backgroundColor: GOLD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    scroll: { padding: 16 },
    searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1.5, borderColor: GOLD, gap: 8 },
    searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#111" },
    row: { flexDirection: "row", gap: 10, marginBottom: 12 },
    input: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: "#111" },
    typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0" },
    typeBtnActive: { backgroundColor: GOLD, borderColor: GOLD },
    typeBtnText: { fontSize: 13, color: "#666", textTransform: "capitalize" },
    typeBtnTextActive: { color: "#fff", fontWeight: "600" },
    searchBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
    searchBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    resultCount: { fontSize: 13, color: "#888", marginBottom: 12 },
    card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
    iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center" },
    info: { flex: 1, gap: 2 },
    name: { fontSize: 14, fontWeight: "700", color: "#111" },
    sub: { fontSize: 12, color: "#666" },
    addr: { fontSize: 12, color: "#888" },
    badge: { backgroundColor: "#FFF8E8", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    badgeText: { fontSize: 11, color: GOLD, fontWeight: "600", textTransform: "capitalize" },
    empty: { alignItems: "center", padding: 40, gap: 10 },
    emptyText: { fontSize: 14, color: "#aaa" },
});