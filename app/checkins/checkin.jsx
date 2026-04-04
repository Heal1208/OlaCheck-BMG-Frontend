import { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    createCheckin, getProducts, createStockEntries,
} from "../../src/services/checkinService";
import AlertBox, { useAlert } from "../../components/AlertBox";

const GOLD = "#E7DA66";

function nowTimeString() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CheckinScreen() {
    const { store } = useLocalSearchParams();
    const storeData = store ? JSON.parse(store) : null;

    const [checkTime, setCheckTime] = useState(nowTimeString());
    const [note, setNote] = useState("");
    const [products, setProducts] = useState([]);
    const [entries, setEntries] = useState({});
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { alertConfig, showAlert, hideAlert } = useAlert();

    useEffect(() => {
        getProducts().then((r) => {
            if (r.success) {
                setProducts(r.data);
                const init = {};
                r.data.forEach((p) => { init[p.product_id] = ""; });
                setEntries(init);
            }
            setLoadingProducts(false);
        });
    }, []);

    const setQty = (productId, val) => {
        setEntries((prev) => ({ ...prev, [productId]: val.replace(/[^0-9]/g, "") }));
    };

    const adjustQty = (productId, delta) => {
        const cur = parseInt(entries[productId]) || 0;
        setEntries((prev) => ({ ...prev, [productId]: String(Math.max(0, cur + delta)) }));
    };

    const handleSubmit = async () => {
        // Validate time
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(checkTime)) {
            showAlert("Lỗi", "Thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM (ví dụ: 09:30).");
            return;
        }

        setSubmitting(true);
        try {
            // Build check_time string
            const today = new Date();
            const [hh, mm] = checkTime.split(":");
            today.setHours(parseInt(hh), parseInt(mm), 0, 0);
            const pad = (n) => String(n).padStart(2, "0");
            const checkTimeStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())} ${pad(today.getHours())}:${pad(today.getMinutes())}:00`;

            // Step 1: Check-in
            const checkinRes = await createCheckin({
                store_id: storeData.store_id,
                note: note || null,
                check_time: checkTimeStr,
            });

            if (!checkinRes.success) {
                showAlert("Thất bại", checkinRes.message);
                setSubmitting(false);
                return;
            }

            const check_id = checkinRes.data.check_id;

            // Step 2: Stock entries (only filled ones)
            const filled = Object.entries(entries)
                .filter(([, qty]) => qty !== "")
                .map(([product_id, qty]) => ({
                    product_id: parseInt(product_id),
                    quantity_on_shelf: parseInt(qty) || 0,
                }));

            if (filled.length === 0) {
                // No stock entered — skip to expiry
                showAlert(
                    "Check-in thành công",
                    `Đã check-in tại ${storeData.store_name} lúc ${checkTime}.\nKhông có dữ liệu tồn kho được nhập.`,
                    [{
                        text: "Kiểm tra hạn sử dụng",
                        onPress: () => router.replace({
                            pathname: "/checkins/expiry",
                            params: { check_id, store_name: storeData.store_name },
                        }),
                    }]
                );
                return;
            }

            const stockRes = await createStockEntries(check_id, filled);

            if (!stockRes.success) {
                showAlert(
                    "Check-in thành công, lưu tồn kho thất bại",
                    stockRes.message,
                    [{
                        text: "Tiếp tục",
                        onPress: () => router.replace({
                            pathname: "/checkins/expiry",
                            params: { check_id, store_name: storeData.store_name },
                        }),
                    }]
                );
                return;
            }

            const lowAlerts = stockRes.data.low_stock_alerts || [];
            const alertMsg = lowAlerts.length > 0
                ? `Đã lưu ${filled.length} sản phẩm.\n\n⚠ Hàng sắp hết:\n${lowAlerts.map((a) => `• ${a.product_name} (còn ${a.quantity})`).join("\n")}`
                : `Đã lưu ${filled.length} sản phẩm thành công.`;

            showAlert("Check-in thành công", alertMsg, [{
                text: "Kiểm tra hạn sử dụng",
                onPress: () => router.replace({
                    pathname: "/checkins/expiry",
                    params: { check_id, store_name: storeData.store_name },
                }),
            }]);
        } catch {
            showAlert("Lỗi", "Không thể kết nối tới máy chủ.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <AlertBox config={alertConfig} onHide={hideAlert} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store Check-in</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Store card */}
                <View style={styles.storeCard}>
                    <View style={styles.storeIcon}>
                        <Ionicons name="storefront-outline" size={26} color={GOLD} />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{storeData?.store_name}</Text>
                        <Text style={styles.storeAddr}>
                            {storeData?.address}, {storeData?.district}, {storeData?.city}
                        </Text>
                    </View>
                </View>

                {/* Time input */}
                <Text style={styles.sectionLabel}>THỜI GIAN CHECK-IN</Text>
                <View style={styles.timeCard}>
                    <Ionicons name="time-outline" size={20} color={GOLD} />
                    <TextInput
                        style={styles.timeInput}
                        value={checkTime}
                        onChangeText={setCheckTime}
                        placeholder="HH:MM"
                        placeholderTextColor="#aaa"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                    />
                    <TouchableOpacity style={styles.nowBtn} onPress={() => setCheckTime(nowTimeString())}>
                        <Ionicons name="refresh-outline" size={13} color={GOLD} />
                        <Text style={styles.nowBtnText}>Giờ hiện tại</Text>
                    </TouchableOpacity>
                </View>

                {/* Note */}
                <Text style={[styles.sectionLabel, { marginTop: 18 }]}>GHI CHÚ (TÙY CHỌN)</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Thêm ghi chú cho lần ghé thăm này..."
                    placeholderTextColor="#aaa"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={2}
                />

                {/* Products */}
                <Text style={[styles.sectionLabel, { marginTop: 4 }]}>NHẬP TỒN KHO</Text>

                {loadingProducts ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="small" color={GOLD} />
                        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
                    </View>
                ) : products.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="cube-outline" size={32} color="#ddd" />
                        <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
                    </View>
                ) : (
                    products.map((item) => {
                        const qty = entries[item.product_id] ?? "";
                        const isLow = qty !== "" && parseInt(qty) < item.low_stock_threshold;
                        return (
                            <View
                                key={item.product_id}
                                style={[styles.productCard, isLow && styles.productCardLow]}
                            >
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.product_name}</Text>
                                    <Text style={styles.productMeta}>
                                        {item.sku} · {item.unit} · Ngưỡng: {item.low_stock_threshold}
                                    </Text>
                                </View>
                                <View style={styles.qtyWrap}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => adjustQty(item.product_id, -1)}
                                    >
                                        <Ionicons name="remove" size={16} color={GOLD} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.qtyInput, isLow && styles.qtyInputLow]}
                                        value={String(qty)}
                                        onChangeText={(v) => setQty(item.product_id, v)}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                        placeholderTextColor="#ccc"
                                    />
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => adjustQty(item.product_id, 1)}
                                    >
                                        <Ionicons name="add" size={16} color={GOLD} />
                                    </TouchableOpacity>
                                </View>
                                {isLow && (
                                    <View style={styles.lowBadge}>
                                        <Ionicons name="warning-outline" size={11} color="#E65100" />
                                        <Text style={styles.lowBadgeText}>Sắp hết</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                            <Text style={styles.submitBtnText}>Check In Now</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: {
        backgroundColor: GOLD, flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    scroll: { padding: 20, paddingBottom: 48 },

    storeCard: {
        backgroundColor: "#fff", borderRadius: 16, padding: 14,
        flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22,
    },
    storeIcon: {
        width: 50, height: 50, borderRadius: 14,
        backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center",
    },
    storeInfo: { flex: 1 },
    storeName: { fontSize: 16, fontWeight: "700", color: "#111" },
    storeAddr: { fontSize: 12, color: "#888", marginTop: 3 },

    sectionLabel: {
        fontSize: 11, fontWeight: "700", color: "#888",
        letterSpacing: 1, marginBottom: 10,
    },

    timeCard: {
        backgroundColor: "#fff", borderRadius: 14,
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 4, gap: 10,
    },
    timeInput: {
        flex: 1, fontSize: 26, fontWeight: "800",
        color: "#111", letterSpacing: 3, paddingVertical: 10,
    },
    nowBtn: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#FFF8E8", borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7,
    },
    nowBtnText: { fontSize: 12, color: GOLD, fontWeight: "600" },

    noteInput: {
        backgroundColor: "#fff", borderRadius: 14, padding: 14,
        fontSize: 14, color: "#111", minHeight: 72,
        textAlignVertical: "top", marginBottom: 18,
    },

    loadingBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 12,
    },
    loadingText: { fontSize: 14, color: "#aaa" },
    emptyBox: {
        alignItems: "center", gap: 8, padding: 28,
        backgroundColor: "#fff", borderRadius: 14, marginBottom: 12,
    },
    emptyText: { fontSize: 13, color: "#aaa" },

    productCard: {
        backgroundColor: "#fff", borderRadius: 14,
        padding: 14, marginBottom: 10,
        flexDirection: "row", alignItems: "center", gap: 12,
    },
    productCardLow: { borderWidth: 1.5, borderColor: "#FF8A65" },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: "700", color: "#111" },
    productMeta: { fontSize: 11, color: "#aaa", marginTop: 3 },

    qtyWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    qtyBtn: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center",
    },
    qtyInput: {
        width: 50, height: 38, backgroundColor: "#f4f4f4",
        borderRadius: 8, textAlign: "center",
        fontSize: 15, fontWeight: "700", color: "#111",
    },
    qtyInputLow: { backgroundColor: "#FFF3E0", color: "#E65100" },

    lowBadge: {
        position: "absolute", top: 8, right: 8,
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#FFF3E0", borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 3,
    },
    lowBadgeText: { fontSize: 10, color: "#E65100", fontWeight: "600" },

    submitBtn: {
        backgroundColor: GOLD, borderRadius: 14, paddingVertical: 18,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 10, marginTop: 16,
    },
    submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});