import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import TabHero from "../../components/TabHero";
import SkeletonPulse from "../../components/SkeletonPulse";
import { getAlerts, handleAlert, resolveAlert } from "../../src/services/checkinService";
import { getUser } from "../../src/services/authService";
import { UI } from "../../constants/theme";

const ALERT_TYPE = {
  low_stock: { color: UI.danger, bg: "#FFF1E2", icon: "warning-outline", label: "Low Stock" },
  near_expiry: { color: UI.purple, bg: "#F2EAFF", icon: "time-outline", label: "Near Expiry" },
};

// Trạng thái alert theo flow
const ALERT_STATUS = {
  open: "open",           // chưa ai xử lý
  handled: "handled",     // manager đã xử lý, chờ admin duyệt
  resolved: "resolved",   // admin đã đóng
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState(ALERT_STATUS.open);
    const [isAdmin, setIsAdmin] = useState(false);
    const { alertConfig, showAlert, hideAlert } = useAlert();

useFocusEffect(
    useCallback(() => {
      getUser().then((u) => setIsAdmin(u?.role === "admin"));
      fetchAlerts(ALERT_STATUS.open);
      setFilter(ALERT_STATUS.open);
    }, [])
  );

  useEffect(() => {
    fetchAlerts(filter);
  }, [filter]);

  const fetchAlerts = async (status) => {
    setLoading(true);
    try {
      const result = await getAlerts({ status });
      setAlerts(result.success ? result.data.alerts : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manager: đánh dấu đã xử lý thực tế
  const handleMarkHandled = (item) => {
    showAlert(
      "Mark as Handled",
      `Confirm you have physically handled the "${item.alert_type.replace("_", " ")}" alert for "${item.product_name}" at ${item.store_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const result = await handleAlert(item.alert_id);
              if (result.success) fetchAlerts(filter);
              else showAlert("Failed", result.message);
            } catch {
              showAlert("Error", "Cannot connect to server.");
            }
          },
        },
      ]
    );
  };

  // Admin: đóng/duyệt alert sau khi đã handled
  const handleResolve = (item) => {
    showAlert(
      "Close Alert",
      `Approve and close this alert for "${item.product_name}"? This confirms the issue has been fully resolved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Alert",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await resolveAlert(item.alert_id);
              if (result.success) fetchAlerts(filter);
              else showAlert("Failed", result.message);
            } catch {
              showAlert("Error", "Cannot connect to server.");
            }
          },
        },
      ]
    );
  };

  const filters = [
    { label: "Open", value: ALERT_STATUS.open },
    { label: "Handled", value: ALERT_STATUS.handled },
    { label: "Resolved", value: ALERT_STATUS.resolved },
  ];

  const renderAlert = ({ item }) => {
    const type = ALERT_TYPE[item.alert_type] || ALERT_TYPE.low_stock;
    const status = item.status; // "open" | "handled" | "resolved"

    return (
      <View style={styles.card}>
        <View style={[styles.alertIcon, { backgroundColor: type.bg }]}>
          <Ionicons name={type.icon} size={21} color={type.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product_name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
              <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
            </View>
          </View>

          <Text style={styles.storeName}>{item.store_name}</Text>
          <Text style={styles.storeMeta}>{item.district}, {item.city}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Qty: {item.quantity_at_alert}</Text>
            <Text style={styles.metaText}>Threshold: {item.low_stock_threshold}</Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString("vi-VN")}
            </Text>
          </View>

          {/* OPEN: Manager có thể handle */}
          {status === ALERT_STATUS.open && (
            <TouchableOpacity
              style={styles.handleButton}
              onPress={() => handleMarkHandled(item)}
            >
              <Ionicons name="construct-outline" size={15} color="#FFFFFF" />
              <Text style={styles.handleButtonText}>Mark as Handled</Text>
            </TouchableOpacity>
          )}

          {/* HANDLED: Chờ Admin duyệt */}
          {status === ALERT_STATUS.handled && (
            <View style={styles.handledSection}>
              <View style={styles.handledBadge}>
                <Ionicons name="construct" size={14} color={UI.info} />
                <Text style={styles.handledText}>
                  Handled{item.handled_by_name ? ` by ${item.handled_by_name}` : ""}
                </Text>
              </View>

              {/* Chỉ Admin mới thấy nút Resolve */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolve(item)}
                >
                  <Ionicons name="shield-checkmark-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.resolveButtonText}>Close Alert</Text>
                </TouchableOpacity>
              )}

              {/* Manager thấy trạng thái chờ */}
              {!isAdmin && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="hourglass-outline" size={13} color={UI.muted} />
                  <Text style={styles.pendingText}>Awaiting admin approval</Text>
                </View>
              )}
            </View>
          )}

          {/* RESOLVED */}
          {status === ALERT_STATUS.resolved && (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={UI.success} />
              <Text style={styles.resolvedText}>
                Closed{item.resolved_by_name ? ` by ${item.resolved_by_name}` : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <TabHero
        eyebrow="Monitoring"
        title="Alerts"
        right={
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{alerts.length}</Text>
          </View>
        }
      >
        <View style={styles.filterRow}>
          {filters.map((item) => {
            const active = filter === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterButton, active && styles.filterButtonActive]}
                onPress={() => setFilter(item.value)}
              >
                <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
                  {item.label}
                </Text>
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
          data={alerts}
          keyExtractor={(item) => String(item.alert_id)}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAlerts(filter); }}
              colors={[UI.primary]}
              tintColor={UI.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Alert Feed</Text>
              <Text style={styles.sectionSub}>
                {filter === ALERT_STATUS.open && "Current issues requiring action"}
                {filter === ALERT_STATUS.handled && "Handled — awaiting admin approval"}
                {filter === ALERT_STATUS.resolved && "Previously closed alerts"}
              </Text>
            </View>
          }
          ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name={filter === ALERT_STATUS.open ? "checkmark-circle-outline" : "archive-outline"}
                size={30}
                color={UI.primaryDark}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === ALERT_STATUS.open ? "No active alerts" : `No ${filter} alerts`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === ALERT_STATUS.open
                ? "Everything looks stable, keep monitoring the stores."
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} alerts will appear here.`}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => fetchAlerts(filter)}>
              <Text style={styles.emptyButtonText}>Refresh Feed</Text>
            </TouchableOpacity>
          </View>
        }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    handledSection: {
        marginTop: 14,
        gap: 10,
      },
      handledBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#E8F1FF",
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
      },
      handledText: {
        fontSize: 12,
        fontWeight: "700",
        color: UI.light.info,
      },
      handleButton: {
        marginTop: 14,
        minHeight: 42,
        borderRadius: 14,
        backgroundColor: UI.light.info,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      },
      handleButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
      },
      pendingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
        backgroundColor: UI.light.border,
      },
      pendingText: {
        fontSize: 12,
        fontWeight: "600",
        color: UI.light.muted,
      },
  container: {
    flex: 1,
    backgroundColor: UI.light.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.light.background,
  },
  loadingSkeleton: {
    width: "80%",
    height: 26,
    borderRadius: 14,
    backgroundColor: UI.light.border,
  },
  countBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: UI.light.primaryDark,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
  filterButtonTextActive: {
    color: UI.light.primaryDark,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 118,
  },
  listHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: UI.light.text,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: UI.light.muted,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    shadowColor: UI.light.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: UI.text,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  storeName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: UI.text,
  },
  storeMeta: {
    marginTop: 3,
    fontSize: 13,
    color: UI.light.muted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: UI.light.muted,
  },
  dateText: {
    marginLeft: "auto",
    fontSize: 12,
    color: UI.light.muted,
  },
  resolveButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: UI.light.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resolveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resolvedBadge: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F8EE",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  resolvedText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI.success,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 46,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: UI.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: UI.light.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: UI.light.muted,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    minWidth: "60%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: UI.light.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
