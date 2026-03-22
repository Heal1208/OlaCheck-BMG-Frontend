import { useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, Platform, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createCheckin } from "../../src/services/checkinService";

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

export default function CheckinScreen() {
    const { store } = useLocalSearchParams();
    const storeData = store ? JSON.parse(store) : null;

    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");

    const handleCheckin = async () => {
        setLoading(true);
        try {
            const result = await createCheckin({
                store_id: storeData.store_id,
                note: note || null,
            });
            if (result.success) {
                showAlert(
                    "Check-in Successful ✓",
                    `You have checked in at ${storeData.store_name}.`,
                    [{
                        text: "Start Stock Entry",
                        onPress: () => router.replace({
                            pathname: "/checkins/stock-entry",
                            params: {
                                check_id: result.data.check_id,
                                store_name: storeData.store_name,
                            }
                        })
                    }]
                );
            } else {
                showAlert("Failed", result.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store Check-in</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.storeCard}>
                    <View style={styles.storeIcon}>
                        <Ionicons name="storefront-outline" size={28} color={GOLD} />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{storeData?.store_name}</Text>
                        <Text style={styles.storeAddr}>
                            {storeData?.address}, {storeData?.district}, {storeData?.city}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={20} color={GOLD} />
                    <Text style={styles.infoText}>
                        Bấm Check In để bắt đầu ghi nhận chuyến thăm cửa hàng này.
                    </Text>
                </View>

                <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note about this visit..."
                    placeholderTextColor="#aaa"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity
                    style={[styles.checkinBtn, loading && { opacity: 0.7 }]}
                    onPress={handleCheckin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                            <Text style={styles.checkinBtnText}>Check In Now</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: { backgroundColor: GOLD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    scroll: { padding: 20, paddingBottom: 40 },
    storeCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    storeIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center" },
    storeInfo: { flex: 1 },
    storeName: { fontSize: 17, fontWeight: "700", color: "#111" },
    storeAddr: { fontSize: 12, color: "#888", marginTop: 4 },
    infoCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF8E8", borderRadius: 12, padding: 14, marginBottom: 24 },
    infoText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 19 },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1, marginBottom: 10 },
    noteInput: { backgroundColor: "#fff", borderRadius: 14, padding: 16, fontSize: 14, color: "#111", minHeight: 90, textAlignVertical: "top", marginBottom: 32 },
    checkinBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    checkinBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});