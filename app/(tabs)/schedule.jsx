import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    FlatList, RefreshControl, StyleSheet, Text,
    TouchableOpacity, View
} from "react-native";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { UI } from "../../constants/theme";
import { getStaffSchedule } from "../../src/services/statsService";

const STEP_ICONS = ["log-in-outline", "cube-outline", "time-outline"];
const STEP_LABELS = ["Check-in", "Stock", "Expiry"];

function ProgressBar({ pct }) {
    return (
        <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
    );
}

function StaffCard({ item }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.8}
            >
                <View style={[styles.avatar, { backgroundColor: item.completion_pct >= 100 ? UI.light.success : UI.light.primaryDark }]}>
                    <Text style={styles.avatarLetter}>{item.full_name?.[0]}</Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.staffName}>{item.full_name}</Text>
                    <Text style={styles.staffSub}>{item.done_stores}/{item.total_stores} stores completed</Text>
                    <ProgressBar pct={item.completion_pct} />
                </View>
                <View style={styles.pctWrap}>
                    <Text style={styles.pctText}>{item.completion_pct}%</Text>
                    <Ionicons
                        name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
                        size={14} color={UI.light.muted}
                    />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.checkinList}>
                    <View style={styles.divider} />
                    {item.checkins.length === 0 ? (
                        <View style={styles.emptyRow}>
                            <Ionicons name="hourglass-outline" size={14} color={UI.light.muted} />
                            <Text style={styles.emptyRowText}>No check-ins today</Text>
                        </View>
                    ) : (
                        item.checkins.map((c) => (
                            <View key={c.check_id} style={styles.checkinRow}>
                                <View style={styles.checkinLeft}>
                                    <Text style={styles.checkinStore} numberOfLines={1}>{c.store_name}</Text>
                                    <Text style={styles.checkinTime}>
                                        {new Date(c.check_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                </View>
                                <View style={styles.stepsRow}>
                                    {STEP_LABELS.map((label, i) => {
                                        const done = c.steps_done > i;
                                        return (
                                            <View key={label} style={[styles.stepChip, { backgroundColor: done ? "#E8F8EE" : "#F0F2F8" }]}>
                                                <Ionicons name={STEP_ICONS[i]} size={11} color={done ? "#29B36A" : "#C4CBD8"} />
                                                <Text style={[styles.stepChipText, { color: done ? "#29B36A" : "#C4CBD8" }]}>{label}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}
        </View>
    );
}

export default function ScheduleScreen() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    useFocusEffect(useCallback(() => { fetchData(); }, [date]));

    const fetchData = async () => {
        try {
            const res = await getStaffSchedule(date);
            if (res.success) setData(res.data.schedule);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const totalDone = data.reduce((s, d) => s + (d.completion_pct >= 100 ? 1 : 0), 0);
    const avgPct = data.length ? Math.round(data.reduce((s, d) => s + d.completion_pct, 0) / data.length) : 0;

    if (loading) return (
        <View style={styles.center}>
            <SkeletonPulse style={{ width: "70%", height: 26, borderRadius: 14 }} />
        </View>
    );

    return (
        <View style={styles.container}>
            <TabHero eyebrow="Monitoring" title="Staff Schedule">
                {/* Date row */}
                <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateArrow} onPress={() => {
                        const d = new Date(date); d.setDate(d.getDate() - 1);
                        setDate(d.toISOString().split("T")[0]);
                    }}>
                        <Ionicons name="chevron-back" size={18} color={UI.light.primaryDark} />
                    </TouchableOpacity>
                    <Text style={styles.dateLabel}>{new Date(date + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</Text>
                    <TouchableOpacity style={styles.dateArrow} onPress={() => {
                        const d = new Date(date); d.setDate(d.getDate() + 1);
                        setDate(d.toISOString().split("T")[0]);
                    }}>
                        <Ionicons name="chevron-forward" size={18} color={UI.light.primaryDark} />
                    </TouchableOpacity>
                </View>

                {/* Summary chips */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryChip}>
                        <Text style={styles.summaryVal}>{data.length}</Text>
                        <Text style={styles.summaryLbl}>Staff</Text>
                    </View>
                    <View style={styles.summaryChip}>
                        <Text style={styles.summaryVal}>{totalDone}</Text>
                        <Text style={styles.summaryLbl}>Completed</Text>
                    </View>
                    <View style={styles.summaryChip}>
                        <Text style={styles.summaryVal}>{avgPct}%</Text>
                        <Text style={styles.summaryLbl}>Avg Progress</Text>
                    </View>
                </View>
            </TabHero>

            <FlatList
                data={data}
                keyExtractor={(item) => String(item.user_id)}
                renderItem={({ item }) => <StaffCard item={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }}
                        colors={[UI.light.primary]} tintColor={UI.light.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.sectionTitle}>Team Overview</Text>
                        <Text style={styles.sectionSub}>Tap a staff to see their visit details</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="people-outline" size={32} color={UI.light.primaryDark} />
                        </View>
                        <Text style={styles.emptyTitle}>No activity today</Text>
                        <Text style={styles.emptyText}>Staff check-ins will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: UI.light.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: UI.light.background },
    dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
    dateArrow: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    dateLabel: { fontSize: 13, fontWeight: "700", color: UI.light.text },
    summaryRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    summaryChip: { flex: 1, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
    summaryVal: { fontSize: 22, fontWeight: "800", color: UI.light.text },
    summaryLbl: { marginTop: 2, fontSize: 11, color: UI.light.muted },
    listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },
    listHeader: { marginBottom: 14 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: UI.light.text },
    sectionSub: { marginTop: 4, fontSize: 13, color: UI.light.muted },
    card: { backgroundColor: UI.light.card, borderRadius: 20, marginBottom: 12, overflow: "hidden", shadowColor: "#D9DEE8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15 },
    avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    avatarLetter: { fontSize: 20, fontWeight: "800", color: "#fff" },
    cardInfo: { flex: 1, gap: 4 },
    staffName: { fontSize: 15, fontWeight: "800", color: UI.light.text },
    staffSub: { fontSize: 12, color: UI.light.muted },
    barBg: { height: 6, backgroundColor: "#E9EDF5", borderRadius: 4, marginTop: 4 },
    barFill: { height: 6, backgroundColor: UI.light.success, borderRadius: 4 },
    pctWrap: { alignItems: "flex-end", gap: 4 },
    pctText: { fontSize: 15, fontWeight: "800", color: UI.light.primaryDark },
    divider: { height: 1, backgroundColor: UI.light.border, marginHorizontal: 15 },
    checkinList: { paddingHorizontal: 15, paddingVertical: 12, gap: 10 },
    checkinRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    checkinLeft: { flex: 1 },
    checkinStore: { fontSize: 13, fontWeight: "700", color: UI.light.text },
    checkinTime: { fontSize: 11, color: UI.light.muted, marginTop: 2 },
    stepsRow: { flexDirection: "row", gap: 5 },
    stepChip: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    stepChipText: { fontSize: 10, fontWeight: "700" },
    emptyRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
    emptyRowText: { fontSize: 13, color: UI.light.muted },
    empty: { alignItems: "center", paddingVertical: 46 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: UI.light.primarySoft, alignItems: "center", justifyContent: "center" },
    emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "800", color: UI.light.text },
    emptyText: { marginTop: 6, fontSize: 13, color: UI.light.muted, textAlign: "center" },
});