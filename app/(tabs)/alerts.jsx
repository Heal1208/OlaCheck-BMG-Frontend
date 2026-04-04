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
import TabHero from "../../components/TabHero";
import { getAlerts, resolveAlert } from "../../src/services/checkinService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  danger: "#FF8A00",
  purple: "#8A52FF",
  border: "#E9EDF5",
  success: "#29B36A",
};

const ALERT_TYPE = {
  low_stock: { color: UI.danger, bg: "#FFF1E2", icon: "warning-outline", label: "Low Stock" },
  near_expiry: { color: UI.purple, bg: "#F2EAFF", icon: "time-outline", label: "Near Expiry" },
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("0");
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      fetchAlerts("0");
      setFilter("0");
    }, [])
  );

  useEffect(() => {
    fetchAlerts(filter);
  }, [filter]);

  const fetchAlerts = async (resolvedValue) => {
    setLoading(true);
    try {
      const result = await getAlerts({ is_resolved: resolvedValue });
      if (result.success) {
        setAlerts(result.data.alerts);
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = (item) => {
    showAlert(
      "Resolve Alert",
      `Mark this ${item.alert_type.replace("_", " ")} alert for "${item.product_name}" at ${item.store_name} as resolved?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await resolveAlert(item.alert_id);
              if (result.success) {
                fetchAlerts(filter);
              } else {
                showAlert("Failed", result.message);
              }
            } catch {
              showAlert("Error", "Cannot connect to server.");
            }
          },
        },
      ]
    );
  };

  const filters = [
    { label: "Open", value: "0" },
    { label: "Resolved", value: "1" },
  ];

  const openCount = alerts.length;

  const renderAlert = ({ item }) => {
    const type = ALERT_TYPE[item.alert_type] || ALERT_TYPE.low_stock;

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
          <Text style={styles.storeMeta}>
            {item.district}, {item.city}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Qty: {item.quantity_at_alert}</Text>
            <Text style={styles.metaText}>Threshold: {item.low_stock_threshold}</Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString("vi-VN")}
            </Text>
          </View>

          {item.is_resolved ? (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={UI.success} />
              <Text style={styles.resolvedText}>
                Resolved{item.resolved_by_name ? ` by ${item.resolved_by_name}` : ""}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.resolveButton} onPress={() => handleResolve(item)}>
              <Ionicons name="checkmark-outline" size={15} color="#FFFFFF" />
              <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
            </TouchableOpacity>
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
        right={(
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filter === "0" ? openCount : alerts.length}</Text>
          </View>
        )}
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
          <ActivityIndicator size="large" color={UI.primary} />
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
              onRefresh={() => {
                setRefreshing(true);
                fetchAlerts(filter);
              }}
              colors={[UI.primary]}
              tintColor={UI.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Alert Feed</Text>
              <Text style={styles.sectionSub}>
                {filter === "0" ? "Current issues requiring action" : "Previously resolved alerts"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={filter === "0" ? "checkmark-circle-outline" : "archive-outline"}
                  size={30}
                  color={UI.primaryDark}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "0" ? "No active alerts" : "No resolved alerts"}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "0"
                  ? "Everything looks stable right now."
                  : "Resolved alerts will appear here."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.background,
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
    color: "#5B5214",
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
    color: "#FFFCE7",
  },
  filterButtonTextActive: {
    color: UI.primaryDark,
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
    color: UI.text,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: UI.muted,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#D9DEE8",
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
    color: UI.muted,
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
    color: UI.muted,
  },
  dateText: {
    marginLeft: "auto",
    fontSize: 12,
    color: UI.muted,
  },
  resolveButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: UI.primaryDark,
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
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: UI.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: UI.muted,
    textAlign: "center",
  },
});
