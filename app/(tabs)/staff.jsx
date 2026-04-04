import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
import { getUser } from "../../src/services/authService";
import { deleteStaff, getStaffList } from "../../src/services/staffService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  border: "#E9EDF5",
  success: "#29B36A",
  danger: "#FF5B5B",
};

const ROLE_STYLE = {
  Admin: { bg: "#F6F1B4", text: "#8A7E18" },
  Manager: { bg: "#EAF4FF", text: "#3178F6" },
  Staff: { bg: "#E8F8EE", text: "#29B36A" },
};

export default function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  const fetchStaff = async () => {
    try {
      const result = await getStaffList();
      if (result.success) {
        setStaff(result.data.staff);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (item) => {
    showAlert("Deactivate Account", `Are you sure you want to deactivate ${item.full_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          const result = await deleteStaff(item.user_id);
          if (result.success) {
            fetchStaff();
          } else {
            showAlert("Failed", result.message);
          }
        },
      },
    ]);
  };

  const canDeactivate = currentUser?.role === "Admin";
  const canCreate = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const activeCount = staff.filter((item) => item.is_active).length;
  const inactiveCount = staff.length - activeCount;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <TabHero
        eyebrow="Team"
        title="Staff"
        right={canCreate ? (
          <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/staff/create")}>
            <Ionicons name="add" size={20} color="#5B5214" />
          </TouchableOpacity>
        ) : null}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      </TabHero>

      <FlatList
        data={staff}
        keyExtractor={(item) => String(item.user_id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStaff();
            }}
            colors={[UI.primary]}
            tintColor={UI.primary}
          />
        }
        renderItem={({ item }) => {
          const roleStyle = ROLE_STYLE[item.role_name] || ROLE_STYLE.Staff;

          return (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: item.is_active ? UI.primaryDark : "#C4CBD8" }]}>
                <Text style={styles.avatarLetter}>{item.full_name?.[0]}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  {canDeactivate && item.is_active && (
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                      <Ionicons name="trash-outline" size={16} color={UI.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.email}>{item.email}</Text>

                <View style={styles.badgeRow}>
                  <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                    <Text style={[styles.roleText, { color: roleStyle.text }]}>{item.role_name}</Text>
                  </View>
                  {!item.is_active && (
                    <View style={[styles.roleBadge, { backgroundColor: "#FFE8E8" }]}>
                      <Text style={[styles.roleText, { color: UI.danger }]}>Inactive</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Team Directory</Text>
            <Text style={styles.sectionSub}>Manage available staff accounts</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={30} color={UI.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptyText}>Staff accounts will appear here.</Text>
          </View>
        }
      />
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
  heroButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#5B5214",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#FFFCE7",
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: UI.text,
  },
  email: {
    marginTop: 5,
    fontSize: 13,
    color: UI.muted,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFE8E8",
    alignItems: "center",
    justifyContent: "center",
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
