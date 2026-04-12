import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList, RefreshControl, StyleSheet, Text,
    TouchableOpacity, View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { UI } from "../../constants/theme";
import { getRecoveryRequests, resolveRecovery } from "../../src/services/statsService";

export default function RecoveryRequestsScreen() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { alertConfig, showAlert, hideAlert } = useAlert();

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await getRecoveryRequests();
            if (res.success) setRequests(res.data);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleResolve = (item) => {
        showAlert(
            "Reset Password",
            `Reset mật khẩu cho ${item.full_name}?\nMật khẩu tạm sẽ được tạo — gọi điện cho nhân viên qua SĐT: ${item.phone}`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xác nhận Reset",
                    onPress: async () => {
                        const res = await resolveRecovery(item.request_id);
                        if (res.success) {
                            showAlert(
                                "Thành công",
                                `Mật khẩu tạm: ${res.data.temp_password}\n\nGọi điện cho ${res.data.staff_name} (${res.data.staff_phone}) để thông báo.`,
                                [{ text: "OK", onPress: fetchRequests }]
                            );
                        } else {
                            showAlert("Thất bại", res.message);
                        }
                    },
                },
            ]
        );
    };

    if (loading) return (
        <View style={styles.center}>
            <SkeletonPulse style={{ width: "70%", height: 24, borderRadius: 12 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            <AlertBox config={alertConfig} onHide={hideAlert} />
            <TabHero eyebrow="Admin" title="Password Recovery" showBack onBack={() => router.back()} />

            <FlatList
                data={requests}
                keyExtractor={(item) => String(item.request_id)}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }}
                        colors={[UI.light.primary]} tintColor={UI.light.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.sectionTitle}>Recovery Requests</Text>
                        <Text style={styles.sectionSub}>{requests.filter(r => r.status === "pending").length} pending</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const isPending = item.status === "pending";
                    return (
                        <View style={[styles.card, !isPending && styles.cardResolved]}>
                            <View style={styles.cardBody}>
                                <Text style={styles.name}>{item.full_name}</Text>
                                <Text style={styles.email}>{item.email}</Text>
                                <Text style={styles.phone}>{item.phone}</Text>
                                <Text style={styles.time}>
                                    {new Date(item.created_at).toLocaleString("vi-VN")}
                                </Text>
                            </View>
                            {isPending ? (
                                <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item)}>
                                    <Ionicons name="key-outline" size={14} color="#fff" />
                                    <Text style={styles.resolveBtnText}>Reset</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.doneBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color="#29B36A" />
                                    <Text style={styles.doneText}>Done</Text>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="key-outline" size={32} color={UI.light.primaryDark} />
                        </View>
                        <Text style={styles.emptyTitle}>No recovery requests</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: UI.light.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },
    listHeader: { marginBottom: 14 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: UI.light.text },
    sectionSub: { marginTop: 4, fontSize: 13, color: UI.light.muted },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: UI.light.card, borderRadius: 18, padding: 15, marginBottom: 10, shadowColor: "#D9DEE8", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
    cardResolved: { opacity: 0.6 },
    cardBody: { flex: 1, gap: 3 },
    name: { fontSize: 15, fontWeight: "800", color: UI.light.text },
    email: { fontSize: 13, color: UI.light.muted },
    phone: { fontSize: 13, fontWeight: "600", color: UI.light.primaryDark },
    time: { fontSize: 11, color: UI.light.muted, marginTop: 4 },
    resolveBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: UI.light.primaryDark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    resolveBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
    doneBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8F8EE", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
    doneText: { fontSize: 12, fontWeight: "700", color: "#29B36A" },
    empty: { alignItems: "center", paddingVertical: 46 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: UI.light.primarySoft, alignItems: "center", justifyContent: "center" },
    emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "800", color: UI.light.text },
});