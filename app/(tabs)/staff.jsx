import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStaffList, deleteStaff } from "../../src/services/staffService";
import { getUser } from "../../src/services/authService";

const C = {
  gold: "#C8860A",
  goldDark: "#A96E08",
  goldBg: "#FFF8E8",
  goldBorder: "rgba(200,134,10,0.22)",
  goldOverlay: "rgba(255,255,255,0.14)",
  goldOverlayBorder: "rgba(255,255,255,0.24)",
  goldMuted: "rgba(255,255,255,0.70)",
  bg: "#F4F4F4",
  white: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#888888",
  border: "#E8E8E8",
  green: "#4CAF89",
  greenBg: "#E8F8F2",
  red: "#E53935",
  redBg: "#FFEBEE",
};

const MANAGER_ROLES = ["Sales_Manager", "Director", "Deputy_Director"];

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

// ─── Divider ──────────────────────────────────────────────────────────────────
const HDivider = ({ style }) => <View style={[styles.hDivider, style]} />;

// ─── Staff Card ───────────────────────────────────────────────────────────────
const StaffCard = ({ item, isManager, onDelete }) => (
  <View style={styles.card}>
    {/* Avatar */}
    <View style={[styles.avatar, { backgroundColor: item.is_active ? C.gold : "#CCCCCC" }]}>
      <Text style={styles.avatarLetter}>{item.full_name?.[0]}</Text>
    </View>

    {/* Info */}
    <View style={styles.cardInfo}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardName}>{item.full_name}</Text>
        {!item.is_active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactive</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardEmail}>{item.email}</Text>

      <HDivider style={styles.cardInnerDivider} />

      <View style={styles.cardBottomRow}>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-outline" size={11} color={C.gold} style={{ marginRight: 4 }} />
          <Text style={styles.roleBadgeText}>{item.role_name?.replace(/_/g, " ")}</Text>
        </View>
        {isManager && item.is_active && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={15} color={C.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { getUser().then(setCurrentUser); }, []);
  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const fetchStaff = async () => {
    try {
      const r = await getStaffList();
      if (r.success) setStaff(r.data.staff);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item) => {
    showAlert(
      "Deactivate Account",
      `Are you sure you want to deactivate ${item.full_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate", style: "destructive",
          onPress: async () => {
            const r = await deleteStaff(item.user_id);
            if (r.success) {
              fetchStaff();
            } else {
              showAlert("Failed", r.message);
            }
          },
        },
      ]
    );
  };

  const isManager = currentUser && MANAGER_ROLES.includes(currentUser.role);

  const activeCount = staff.filter(s => s.is_active).length;
  const inactiveCount = staff.length - activeCount;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>Staff</Text>
          </View>
          {isManager && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push("/staff/create")}
            >
              <Ionicons name="add" size={20} color={C.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role divider */}
        <View style={styles.roleDividerRow}>
          <View style={styles.headerDivider} />
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Manage Accounts</Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{staff.length}</Text>
            <View style={styles.statMiniDivider} />
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statVertDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <View style={styles.statMiniDivider} />
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statVertDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <View style={styles.statMiniDivider} />
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      </View>

      {/* ── LIST ── */}
      <FlatList
        data={staff}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={({ item }) => (
          <StaffCard item={item} isManager={isManager} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStaff(); }}
            colors={[C.gold]}
            tintColor={C.gold}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>All Staff</Text>
            </View>
            <Text style={styles.sectionSub}>{staff.length} members found</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people-outline" size={32} color={C.gold} />
            </View>
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff members will appear here once added.</Text>
          </View>
        }
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  // Header
  header: {
    backgroundColor: C.gold,
    paddingTop: 52,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  rolePill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  rolePillText: {
    fontSize: 11,
    color: C.white,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  statMiniDivider: {
    width: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statVertDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 12,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 4,
  },
  listHeader: {
    paddingTop: 24,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    backgroundColor: C.gold,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: C.muted,
    marginLeft: 11,
    lineHeight: 19,
  },

  // Staff card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: "800",
    color: C.white,
  },
  cardInfo: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  cardEmail: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 0,
  },
  cardInnerDivider: {
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Divider
  hDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Role badge
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.goldBg,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  roleBadgeText: {
    fontSize: 11,
    color: C.goldDark,
    fontWeight: "600",
  },

  // Inactive badge
  inactiveBadge: {
    backgroundColor: C.redBg,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
  },
  inactiveBadgeText: {
    fontSize: 10,
    color: C.red,
    fontWeight: "600",
  },

  // Delete button
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.redBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 52,
    gap: 10,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.goldBg,
    borderWidth: 1.5,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 19,
  },
});