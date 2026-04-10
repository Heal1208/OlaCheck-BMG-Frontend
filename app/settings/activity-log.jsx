import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { UI } from "../../constants/theme";
import API_BASE_URL from "../../src/config/api";
import { getUser } from "../../src/services/authService";

const authHeader = async () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

const getActivityLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/activity-logs?${query}`, {
    headers: await authHeader(),
  });
  return res.json();
};

const ACTION_STYLE = {
  checkin_created: { bg: "#EAF4FF", color: "#3178F6", icon: "location-outline" },
  stock_entry: { bg: "#E8F8EE", color: "#29B36A", icon: "cube-outline" },
  alert_resolved: { bg: "#E8F8EE", color: "#29B36A", icon: "shield-checkmark-outline" },
  alert_handled: { bg: "#FFF8DC", color: "#B89B00", icon: "construct-outline" },
  store_created: { bg: "#F2EAFF", color: "#7C3CE0", icon: "storefront-outline" },
  store_updated: { bg: "#F2EAFF", color: "#7C3CE0", icon: "pencil-outline" },
  store_deleted: { bg: "#FFE8E8", color: "#E03030", icon: "trash-outline" },
  staff_created: { bg: "#EAF4FF", color: "#3178F6", icon: "person-add-outline" },
  staff_deactivated: { bg: "#FFE8E8", color: "#E03030", icon: "person-remove-outline" },
  user_login: { bg: "#F6F7FF", color: "#888", icon: "log-in-outline" },
  password_changed: { bg: "#FFF1E2", color: "#E07B2E", icon: "lock-closed-outline" },
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "Check-in", value: "checkin_created" },
  { label: "Stock", value: "stock_entry" },
  { label: "Stores", value: "store_created,store_updated,store_deleted" },
  { label: "Alerts", value: "alert_handled,alert_resolved" },
  { label: "Staff", value: "staff_created,staff_deactivated" },
];

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.action_type = filter;
      const res = await getActivityLogs(params);
      setLogs(res.success ? (res.data.logs || []) : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = search.trim()
    ? logs.filter(
      (l) =>
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.target_entity?.toLowerCase().includes(search.toLowerCase())
    )
    : logs;

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffH = diffMs / 3600000;
    if (diffH < 1) return `${Math.round(diffMs / 60000)} mins ago`;
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    if (diffH < 48) return `Yesterday · ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" }) + ` · ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const renderLog = ({ item }) => {
    const styleConf = ACTION_STYLE[item.action_type] || {
      bg: "#F0F0F0", color: "#666", icon: "flash-outline",
    };
    return (
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: styleConf.bg }]}>
          <Ionicons name={styleConf.icon} size={18} color={styleConf.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || item.action_type?.replace(/_/g, " ")}
          </Text>
          <View style={styles.metaRow}>
            {item.actor_name && (
              <View style={styles.actorBadge}>
                <Text style={styles.actorText}>{item.actor_name}</Text>
              </View>
            )}
            {item.target_entity && (
              <View style={[styles.entityBadge, { backgroundColor: styleConf.bg }]}>
                <Text style={[styles.entityText, { color: styleConf.color }]}>
                  {item.target_entity}
                  {item.target_id ? ` #${item.target_id}` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TabHero
        eyebrow="System"
        title="Activity Log"
        showBack
        backLabel="Back"
        onBack={() => router.back()}
      >
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={UI.light.primaryDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            placeholderTextColor={UI.light.primaryDark + "88"}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={UI.light.primaryDark} />
            </TouchableOpacity>
          )}
        </View>
        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.value)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TabHero>

      {loading ? (
        <View style={styles.center}>
          <SkeletonPulse style={{ width: "80%", height: 24, borderRadius: 12 }} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.log_id)}
          renderItem={renderLog}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchLogs(); }}
              colors={[UI.light.primary]}
              tintColor={UI.light.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>
                {filtered.length} log{filtered.length !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.sectionSub}>All system-impacting actions</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={32} color={UI.light.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>No logs found</Text>
              <Text style={styles.emptyText}>
                {search ? "Try a different keyword." : "Activity logs will appear here."}
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={fetchLogs}>
                <Text style={styles.emptyBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.light.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    minHeight: 48, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 14, marginTop: 14,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: UI.light.primaryDark, paddingVertical: 0,
  },

  filterRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  filterChipActive: { backgroundColor: "#FFFFFF" },
  filterChipText: { fontSize: 12, fontWeight: "700", color: UI.light.primaryDark + "88" },
  filterChipTextActive: { color: UI.light.primaryDark },

  listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },
  listHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: UI.light.text },
  sectionSub: { marginTop: 4, fontSize: 13, color: UI.light.muted },

  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: UI.light.card, borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: "#D9DEE8", shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 6 },
  cardDesc: { fontSize: 14, fontWeight: "600", color: UI.light.text, lineHeight: 20 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actorBadge: {
    backgroundColor: "#F0F2F8", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  actorText: { fontSize: 11, fontWeight: "700", color: "#555" },
  entityBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  entityText: { fontSize: 11, fontWeight: "700" },
  timeText: { fontSize: 11, color: UI.light.muted, marginTop: 2, textAlign: "right" },

  empty: { alignItems: "center", paddingVertical: 46 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: UI.light.primarySoft,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "800", color: UI.light.text },
  emptyText: { marginTop: 6, fontSize: 13, color: UI.light.muted, textAlign: "center" },
  emptyBtn: {
    marginTop: 16, minWidth: "55%", paddingVertical: 12, borderRadius: 14,
    backgroundColor: UI.light.primaryDark, alignItems: "center",
  },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
