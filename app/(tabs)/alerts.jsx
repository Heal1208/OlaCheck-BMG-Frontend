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
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { UI } from "../../constants/theme";
import { getUser } from "../../src/services/authService";
import {
  getAlerts,
  getCheckins,
  resolveAlert,
} from "../../src/services/checkinService";

const ALERT_TYPE = {
  low_stock: { color: "#E07B2E", bg: "#FFF1E2", icon: "warning-outline", label: "Low Stock" },
  near_expiry: { color: "#7C3CE0", bg: "#F2EAFF", icon: "time-outline", label: "Near Expiry" },
};

const STATUS_STYLE = {
  completed: { bg: "#E8F8EE", color: "#29B36A", label: "Completed" },
  pending: { bg: "#FFF8DC", color: "#B89B00", label: "Pending" },
  in_progress: { bg: "#EAF4FF", color: "#3178F6", label: "In Progress" },
};

// FIX 1: SQLite trả về is_resolved là integer 0/1, không phải boolean true/false
const checkIsResolved = (a) => {
  if (!a) return false;
  return a.is_resolved === 1 || a.is_resolved === true;
};

function AlertChip({ alert, canResolve, onResolve }) {
  const type = ALERT_TYPE[alert.alert_type] || ALERT_TYPE.low_stock;
  const isResolved = checkIsResolved(alert);

  return (
    <View style={[chip.wrap, { borderColor: type.color + "33" }]}>
      <View style={[chip.iconWrap, { backgroundColor: type.bg }]}>
        <Ionicons name={type.icon} size={14} color={type.color} />
      </View>
      <View style={chip.body}>
        <Text style={chip.product} numberOfLines={1}>{alert.product_name}</Text>
        <Text style={chip.meta}>
          Tồn: {alert.quantity_at_alert} · Ngưỡng: {alert.low_stock_threshold}
        </Text>
      </View>
      <View style={chip.right}>
        {!isResolved && canResolve && (
          <TouchableOpacity
            style={[chip.action, { backgroundColor: "#29B36A" }]}
            onPress={() => onResolve(alert)}
          >
            <Ionicons name="checkmark-done-outline" size={12} color="#fff" />
            <Text style={chip.actionText}>Resolve</Text>
          </TouchableOpacity>
        )}
        {!isResolved && !canResolve && (
          <View style={[chip.action, { backgroundColor: "#FFF1E2" }]}>
            <Ionicons name="warning-outline" size={12} color="#E07B2E" />
            <Text style={[chip.actionText, { color: "#E07B2E" }]}>Open</Text>
          </View>
        )}
        {isResolved && (
          <View style={[chip.action, { backgroundColor: "#E8F8EE" }]}>
            <Ionicons name="checkmark-circle" size={12} color="#29B36A" />
            <Text style={[chip.actionText, { color: "#29B36A" }]}>Resolved</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function AlertCard({ item, canResolve, onResolve, isResolvedTab }) {
  const type = ALERT_TYPE[item.alert_type] || ALERT_TYPE.low_stock;
  const isResolved = isResolvedTab || checkIsResolved(item);

  // FIX 2: Backend trả về check_id, không phải checkin_id
  const checkId = item.check_id ?? item.checkin_id;

  return (
    <View style={styles.card}>
      <View style={[styles.cardIconWrap, { backgroundColor: type.bg }]}>
        <Ionicons name={type.icon} size={22} color={type.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.product_name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
            <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
          </View>
        </View>

        <Text style={styles.storeName}>{item.store_name}</Text>
        {(item.district || item.city) && (
          <Text style={styles.storeMeta}>{item.district}, {item.city}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>Tồn: {item.quantity_at_alert}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: "#FFF1E2" }]}>
            <Text style={[styles.metaChipText, { color: "#E07B2E" }]}>
              Min: {item.low_stock_threshold}
            </Text>
          </View>
          {checkId && (
            <View style={styles.checkinBadge}>
              <Ionicons name="location-outline" size={11} color={UI.light.primaryDark} />
              <Text style={styles.checkinBadgeText}>Check-in #{checkId}</Text>
            </View>
          )}
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {!isResolved && canResolve && (
          <TouchableOpacity style={styles.resolveBtn} onPress={() => onResolve(item)}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.resolveBtnText}>Resolve Alert</Text>
          </TouchableOpacity>
        )}

        {!isResolved && !canResolve && (
          <View style={styles.openBadge}>
            <Ionicons name="warning-outline" size={13} color="#E07B2E" />
            <Text style={styles.openBadgeText}>Awaiting resolution</Text>
          </View>
        )}

        {isResolved && (
          <View style={styles.resolvedBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#29B36A" />
            <Text style={styles.resolvedText}>
              Resolved{item.resolved_by_name ? ` by ${item.resolved_by_name}` : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CheckInCard({ item, canResolve, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // FIX 3: dùng check_id (field backend trả về)
  const id = item.check_id ?? item.checkin_id ?? item.id;
  const statusStyle = STATUS_STYLE[item.status] || STATUS_STYLE.completed;

  const toggle = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (hasFetched) return;
    setLoadingAlerts(true);
    try {
      // FIX 3: Backend không filter theo checkin_id, lấy tất cả rồi lọc client-side
      const res = await getAlerts({ is_resolved: "0" });
      if (res.success) {
        const list = res.data?.alerts ?? res.data ?? [];
        const all = Array.isArray(list) ? list : [];
        const linked = all.filter((a) => a.check_id === id || a.checkin_id === id);
        setAlerts(linked);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
      setHasFetched(true);
    }
  };

  const openAlerts = alerts.filter((a) => !checkIsResolved(a));

  return (
    <View style={styles.checkoutCard}>
      <TouchableOpacity style={styles.checkoutHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.checkoutIconWrap}>
          <Ionicons name="location-outline" size={20} color={UI.light.primaryDark} />
        </View>
        <View style={styles.checkoutInfo}>
          <View style={styles.checkoutTitleRow}>
            <Text style={styles.checkoutTitle}>Check-in #{id}</Text>
            {openAlerts.length > 0 && (
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{openAlerts.length} alert</Text>
              </View>
            )}
          </View>
          <Text style={styles.checkoutStore} numberOfLines={1}>
            {item.store_name || "Store"}
          </Text>
          <Text style={styles.checkoutTime}>
            {new Date(item.check_time || item.created_at || Date.now()).toLocaleString("vi-VN")}
          </Text>
          {item.note ? (
            <Text style={styles.checkoutNote} numberOfLines={1}>{item.note}</Text>
          ) : null}
        </View>
        <View style={styles.checkoutRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={16}
            color={UI.light.muted}
            style={{ marginTop: 6 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.alertsExpanded}>
          <View style={styles.alertsDivider} />
          {loadingAlerts ? (
            <ActivityIndicator size="small" color={UI.light.primaryDark} style={{ marginVertical: 10 }} />
          ) : alerts.length === 0 ? (
            <View style={styles.noAlertRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#29B36A" />
              <Text style={styles.noAlertText}>Không có alert cho check-in này</Text>
            </View>
          ) : (
            <View style={styles.alertChipList}>
              <Text style={styles.alertChipLabel}>
                {alerts.length} alert{alerts.length > 1 ? "s" : ""} liên kết
              </Text>
              {alerts.map((a) => (
                <AlertChip
                  key={a.alert_id}
                  alert={a}
                  canResolve={canResolve}
                  onResolve={onResolve}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function AlertsScreen() {
  const [tab, setTab] = useState("checkins");
  const [checkins, setCheckins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canResolve, setCanResolve] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      getUser().then((u) => {
        setCanResolve(["Admin", "Manager"].includes(u?.role));
        setUserRole(u?.role ?? null);
      });
      loadTab("checkins");
      setTab("checkins");
    }, [])
  );

  useEffect(() => {
    loadTab(tab);
  }, [tab]);

  const loadTab = async (currentTab) => {
    setLoading(true);
    try {
      if (currentTab === "checkins") {
        const res = await getCheckins();
        const list = res?.data?.checkins ?? res?.data?.check_ins ?? res?.data ?? [];
        setCheckins(res?.success !== false ? (Array.isArray(list) ? list : []) : []);
      } else {
        // FIX 4: Gọi API 1 lần với đúng param, không spam nhiều requests
        const isResolved = currentTab === "resolved" ? "1" : "0";
        const res = await getAlerts({ is_resolved: isResolved });
        const list = res?.data?.alerts ?? res?.data ?? [];
        setAlerts(Array.isArray(list) ? list : []);
      }
    } catch {
      setCheckins([]);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = (item) => {
    showAlert(
      "Resolve Alert",
      `Xác nhận đã xử lý "${item.alert_type?.replace(/_/g, " ")}" cho "${item.product_name}" tại ${item.store_name}?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Resolve",
          onPress: async () => {
            try {
              const res = await resolveAlert(item.alert_id);
              if (res.success) {
                showAlert("Thành công", "Alert đã được resolve.", [
                  { text: "OK", onPress: () => loadTab(tab) },
                ]);
              } else {
                showAlert("Thất bại", res.message || "Không thể resolve alert.");
              }
            } catch {
              showAlert("Lỗi", "Không thể kết nối đến máy chủ.");
            }
          },
        },
      ]
    );
  };

  // Staff chỉ thấy Check-ins & Resolved, không có tab Alerts
  const ALL_TABS = [
    { label: "Check-ins", value: "checkins", icon: "location-outline" },
    { label: "Alerts", value: "alerts", icon: "warning-outline" },
    { label: "Resolved", value: "resolved", icon: "shield-checkmark-outline" },
  ];
  const TABS = userRole === "Staff"
    ? ALL_TABS.filter((t) => t.value !== "alerts")
    : ALL_TABS;

  const listData = tab === "checkins" ? checkins : alerts;
  const badgeCount = listData.length;

  return (
    <View style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <TabHero
        eyebrow="Monitoring"
        title="Activity"
        right={
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{badgeCount}</Text>
          </View>
        }
      >
        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.value)}
              >
                <Ionicons name={t.icon} size={14} color={active ? UI.light.primaryDark : "#ffffff88"} />
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TabHero>

      {loading ? (
        <View style={styles.center}>
          <SkeletonPulse style={styles.loadingSkeleton} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) =>
            tab === "checkins"
              ? String(item.check_id ?? item.checkin_id ?? item.id)
              : String(item.alert_id)
          }
          renderItem={({ item }) =>
            tab === "checkins" ? (
              <CheckInCard item={item} canResolve={canResolve} onResolve={handleResolve} />
            ) : (
              <AlertCard item={item} canResolve={canResolve} onResolve={handleResolve} isResolvedTab={tab === "resolved"} />
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadTab(tab); }}
              colors={[UI.light.primary]}
              tintColor={UI.light.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>
                {tab === "checkins" ? "Check-in History" : tab === "alerts" ? "Active Alerts" : "Resolved Alerts"}
              </Text>
              <Text style={styles.sectionSub}>
                {tab === "checkins" ? "Tap a check-in to view linked alerts" :
                  tab === "alerts" ? "Low-stock alerts from recent check-ins" :
                    "Alerts that have been fully resolved"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={tab === "checkins" ? "location-outline" : tab === "alerts" ? "checkmark-circle-outline" : "archive-outline"}
                  size={32} color={UI.light.primaryDark}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {tab === "checkins" ? "Chưa có check-in nào" : tab === "alerts" ? "Không có alert nào" : "Chưa có alert nào được resolve"}
              </Text>
              <Text style={styles.emptyText}>
                {tab === "checkins" ? "Lịch sử thăm điểm bán sẽ xuất hiện ở đây." :
                  tab === "alerts" ? "Tất cả tồn kho đang ổn định." :
                    "Các alert đã xử lý sẽ xuất hiện ở đây."}
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => loadTab(tab)}>
                <Text style={styles.emptyBtnText}>Làm mới</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: "#FAFBFF", padding: 10, marginBottom: 8,
  },
  iconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  product: { fontSize: 13, fontWeight: "700", color: "#111" },
  meta: { fontSize: 11, color: "#888" },
  right: { alignItems: "flex-end" },
  action: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  actionText: { fontSize: 11, fontWeight: "700", color: "#fff" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.light.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingSkeleton: { width: "80%", height: 26, borderRadius: 14 },

  countBadge: { minWidth: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  countBadgeText: { fontSize: 14, fontWeight: "800", color: UI.light.primaryDark },

  tabRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)" },
  tabBtnActive: { backgroundColor: "#FFFFFF" },
  tabBtnText: { fontSize: 12, fontWeight: "700", color: "#ffffff88" },
  tabBtnTextActive: { color: UI.light.primaryDark },

  listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },
  listHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: UI.light.text },
  sectionSub: { marginTop: 4, fontSize: 13, color: UI.light.muted },

  checkoutCard: { backgroundColor: UI.light.card, borderRadius: 20, marginBottom: 12, shadowColor: "#D9DEE8", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5, overflow: "hidden" },
  checkoutHeader: { flexDirection: "row", alignItems: "flex-start", padding: 15, gap: 12 },
  checkoutIconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: UI.light.primarySoft, alignItems: "center", justifyContent: "center" },
  checkoutInfo: { flex: 1, gap: 2 },
  checkoutTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkoutTitle: { fontSize: 15, fontWeight: "800", color: UI.light.text },
  alertCountBadge: { backgroundColor: "#FFF1E2", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  alertCountText: { fontSize: 11, fontWeight: "800", color: "#E07B2E" },
  checkoutStore: { fontSize: 13, color: UI.light.muted },
  checkoutTime: { fontSize: 12, color: UI.light.muted },
  checkoutNote: { fontSize: 12, color: UI.light.muted, fontStyle: "italic" },
  checkoutRight: { alignItems: "flex-end" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  alertsExpanded: { paddingHorizontal: 15, paddingBottom: 14 },
  alertsDivider: { height: 1, backgroundColor: UI.light.border, marginBottom: 12 },
  noAlertRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  noAlertText: { fontSize: 13, color: "#29B36A", fontWeight: "600" },
  alertChipList: { gap: 2 },
  alertChipLabel: { fontSize: 11, fontWeight: "700", color: UI.light.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },

  card: { flexDirection: "row", gap: 12, backgroundColor: UI.light.card, borderRadius: 20, padding: 15, marginBottom: 12, shadowColor: "#D9DEE8", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  cardIconWrap: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: UI.light.text },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  storeName: { marginTop: 6, fontSize: 13, fontWeight: "700", color: UI.light.text },
  storeMeta: { marginTop: 2, fontSize: 12, color: UI.light.muted },

  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 },
  metaChip: { backgroundColor: "#F0F2F8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  checkinBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: UI.light.primarySoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  checkinBadgeText: { fontSize: 11, fontWeight: "700", color: UI.light.primaryDark },
  dateText: { marginLeft: "auto", fontSize: 12, color: UI.light.muted },

  resolveBtn: { marginTop: 12, minHeight: 42, borderRadius: 12, backgroundColor: "#29B36A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  resolveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  openBadge: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF1E2", alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  openBadgeText: { fontSize: 12, fontWeight: "600", color: "#E07B2E" },

  resolvedBadge: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E8F8EE", alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  resolvedText: { fontSize: 12, fontWeight: "700", color: "#29B36A" },

  empty: { alignItems: "center", paddingVertical: 46 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: UI.light.primarySoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "800", color: UI.light.text },
  emptyText: { marginTop: 6, fontSize: 13, color: UI.light.muted, textAlign: "center" },
  emptyBtn: { marginTop: 16, minWidth: "55%", paddingVertical: 12, borderRadius: 14, backgroundColor: UI.light.primaryDark, alignItems: "center" },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});