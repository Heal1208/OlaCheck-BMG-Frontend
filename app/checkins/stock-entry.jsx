import { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts, createStockEntries, completeCheckin } from "../../src/services/checkinService";
import AlertBox, { useAlert } from "../../components/AlertBox";

const GOLD = "#E7DA66";

export default function StockEntryScreen() {
    const { check_id, store_name } = useLocalSearchParams();

    const [products, setProducts] = useState([]);
    const [entries, setEntries] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { alertConfig, showAlert, hideAlert } = useAlert();

    useEffect(() => {
        getProducts().then((r) => {
            if (r.success) {
                setProducts(r.data);
                const init = {};
                r.data.forEach((p) => { init[p.product_id] = ""; });
                setEntries(init);
            }
            setLoading(false);
        });
    }, []);

    const setQty = (productId, val) => {
        setEntries((prev) => ({ ...prev, [productId]: val.replace(/[^0-9]/g, "") }));
    };

    const adjustQty = (productId, delta) => {
        const cur = parseInt(entries[productId]) || 0;
        setEntries((prev) => ({ ...prev, [productId]: String(Math.max(0, cur + delta)) }));
    };

    const handleSave = async () => {
        const filled = Object.entries(entries)
            .filter(([, qty]) => qty !== "")
            .map(([product_id, qty]) => ({
                product_id: parseInt(product_id),
                quantity_on_shelf: parseInt(qty) || 0,
            }));

        if (filled.length === 0) {
            showAlert("Lỗi", "Vui lòng nhập số lượng ít nhất một sản phẩm.");
            return;
        }

        setSaving(true);
        try {
            const r = await createStockEntries(parseInt(check_id), filled);
            if (r.success) {
                const alerts = r.data.low_stock_alerts || [];
                const alertMsg = alerts.length > 0
                    ? `${r.message}\n\n⚠ Hàng sắp hết:\n${alerts.map((a) => `• ${a.product_name} (còn ${a.quantity})`).join("\n")}`
                    : r.message;

                showAlert("Đã lưu", alertMsg, [{
                    text: "Kiểm tra hạn sử dụng",
                    onPress: () => router.push({
                        pathname: "/checkins/expiry",
                        params: { check_id, store_name },
                    }),
                }]);
            } else {
                showAlert("Thất bại", r.message);
            }
        } catch {
            showAlert("Lỗi", "Không thể kết nối tới máy chủ.");
        } finally { setSaving(false); }
    };

    const handleComplete = () => {
        showAlert(
            "Hoàn thành check-in",
            "Bỏ qua kiểm tra hạn sử dụng và kết thúc lần ghé thăm này?",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Hoàn thành", style: "destructive",
                    onPress: async () => {
                        const r = await completeCheckin(parseInt(check_id));
                        if (r.success) {
                            showAlert("Xong!", "Check-in đã được hoàn thành.", [
                                { text: "OK", onPress: () => router.replace("/(tabs)/stores") }
                            ]);
                        } else {
                            showAlert("Lỗi", r.message);
                        }
                    }
                }
            ]
        );
    };

    const renderProduct = ({ item }) => {
        const qty = entries[item.product_id] ?? "";
        const isLow = qty !== "" && parseInt(qty) < item.low_stock_threshold;

        return (
            <View style={[styles.productCard, isLow && styles.productCardLow]}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.product_name}</Text>
                    <Text style={styles.productMeta}>{item.sku} · {item.unit}</Text>
                    <Text style={styles.productThreshold}>Ngưỡng cảnh báo: {item.low_stock_threshold}</Text>
                </View>
                <View style={styles.qtyWrap}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(item.product_id, -1)}>
                        <Ionicons name="remove" size={18} color={GOLD} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.qtyInput, isLow && styles.qtyInputLow]}
                        value={String(qty)}
                        onChangeText={(v) => setQty(item.product_id, v)}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#ccc"
                    />
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(item.product_id, 1)}>
                        <Ionicons name="add" size={18} color={GOLD} />
                    </TouchableOpacity>
                </View>
                {isLow && (
                    <View style={styles.lowBadge}>
                        <Ionicons name="warning-outline" size={12} color="#E65100" />
                        <Text style={styles.lowBadgeText}>Sắp hết</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <AlertBox config={alertConfig} onHide={hideAlert} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Nhập tồn kho</Text>
                    <Text style={styles.headerSub}>{store_name}</Text>
                </View>
                <View style={{ width: 22 }} />
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                <View style={styles.step}>
                    <View style={styles.stepDoneCircle}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                    <Text style={styles.stepTextDone}>Check-in</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: GOLD }]} />
                <View style={styles.step}>
                    <View style={styles.stepActiveCircle}>
                        <Text style={styles.stepCircleText}>2</Text>
                    </View>
                    <Text style={styles.stepTextActive}>Tồn kho</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={styles.stepIdleCircle}>
                        <Text style={styles.stepIdleText}>3</Text>
                    </View>
                    <Text style={styles.stepTextIdle}>Hạn dùng</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
                </View>
            ) : products.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cube-outline" size={48} color="#ddd" />
                    <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
                    <Text style={styles.emptyHint}>Liên hệ admin để thêm sản phẩm</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => String(item.product_id)}
                    renderItem={renderProduct}
                    contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text style={styles.listHint}>
                            Nhập số lượng thực tế trên kệ cho từng sản phẩm
                        </Text>
                    }
                />
            )}

            {/* Footer buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.skipBtn} onPress={handleComplete}>
                    <Text style={styles.skipBtnText}>Bỏ qua & Hoàn thành</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Text style={styles.saveBtnText}>Lưu & Tiếp theo</Text>
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
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },

    header: {
        backgroundColor: GOLD, flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 12, color: "#ffffff99", marginTop: 2 },

    progressBar: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#fff", paddingHorizontal: 28, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
    },
    step: { alignItems: "center", gap: 4 },
    stepLine: { flex: 1, height: 2, backgroundColor: "#e0e0e0", marginHorizontal: 8 },
    stepDoneCircle: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: GOLD, alignItems: "center", justifyContent: "center",
    },
    stepActiveCircle: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: GOLD, alignItems: "center", justifyContent: "center",
    },
    stepIdleCircle: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: "#e0e0e0", alignItems: "center", justifyContent: "center",
    },
    stepCircleText: { fontSize: 12, color: "#fff", fontWeight: "700" },
    stepIdleText: { fontSize: 12, color: "#999", fontWeight: "700" },
    stepTextDone: { fontSize: 10, color: GOLD, fontWeight: "600" },
    stepTextActive: { fontSize: 10, color: GOLD, fontWeight: "700" },
    stepTextIdle: { fontSize: 10, color: "#999" },

    listHint: {
        fontSize: 12, color: "#888", marginBottom: 12,
        paddingHorizontal: 4,
    },

    loadingText: { fontSize: 14, color: "#aaa", marginTop: 8 },
    emptyText: { fontSize: 16, fontWeight: "600", color: "#aaa" },
    emptyHint: { fontSize: 13, color: "#ccc" },

    productCard: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: 14, marginBottom: 10,
        flexDirection: "row", alignItems: "center", gap: 12,
    },
    productCardLow: { borderWidth: 1.5, borderColor: "#FF8A65" },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: "700", color: "#111" },
    productMeta: { fontSize: 12, color: "#888", marginTop: 2 },
    productThreshold: { fontSize: 11, color: "#aaa", marginTop: 2 },

    qtyWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    qtyBtn: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center",
    },
    qtyInput: {
        width: 52, height: 40, backgroundColor: "#f4f4f4",
        borderRadius: 8, textAlign: "center",
        fontSize: 16, fontWeight: "700", color: "#111",
    },
    qtyInputLow: { backgroundColor: "#FFF3E0", color: "#E65100" },

    lowBadge: {
        position: "absolute", top: 8, right: 8,
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#FFF3E0", borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 3,
    },
    lowBadgeText: { fontSize: 10, color: "#E65100", fontWeight: "600" },

    footer: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        flexDirection: "row", gap: 12, padding: 16,
        backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0",
    },
    skipBtn: {
        flex: 1, borderWidth: 1.5, borderColor: "#e0e0e0",
        borderRadius: 12, paddingVertical: 15, alignItems: "center",
    },
    skipBtnText: { fontSize: 13, color: "#666", fontWeight: "600" },
    saveBtn: {
        flex: 2, backgroundColor: GOLD, borderRadius: 12,
        paddingVertical: 15, flexDirection: "row",
        alignItems: "center", justifyContent: "center", gap: 8,
    },
    saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});