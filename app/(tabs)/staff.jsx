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
import { getUser } from "../../src/services/authService";
import { deleteStaff, getStaffList } from "../../src/services/staffService";

const GOLD = "#C8960C";

// Badge style per role
const ROLE_STYLE = {
  Admin: { bg: "#FFF0F0", text: "#C0392B" },
  Manager: { bg: "#E8F5E9", text: "#27AE60" },
  Staff: { bg: "#FFF8E8", text: GOLD },
};

export default function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useEffect(() => { getUser().then(setCurrentUser); }, []);
  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const fetchStaff = async () => {
    try {
      const r = await getStaffList();
      if (r.success) setStaff(r.data.staff);
    } finally { setLoading(false); setRefreshing(false); }
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
            if (r.success) fetchStaff();
            else showAlert("Failed", r.message);
          },
        },
      ]
    );
  };

  // Chỉ Admin mới có thể xóa/deactivate tài khoản
  const canDeactivate = currentUser?.role === "Admin";
  // Admin + Manager đều có thể tạo tài khoản mới
  const canCreate = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const renderItem = ({ item }) => {
    const rs = ROLE_STYLE[item.role_name] || ROLE_STYLE.Staff;
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: item.is_active ? GOLD : "#ccc" }]}>
          <Text style={styles.avatarLetter}>{item.full_name?.[0]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: rs.bg }]}>
              <Text style={[styles.roleText, { color: rs.text }]}>{item.role_name}</Text>
            </View>
            {!item.is_active && (
              <View style={[styles.roleBadge, { backgroundColor: "#FFEBEE" }]}>
                <Text style={[styles.roleText, { color: "#E53935" }]}>Inactive</Text>
              </View>
            )}
          </View>
        </View>
        {canDeactivate && item.is_active && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#E53935" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <View style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff</Text>
        {canCreate && (
          <TouchableOpacity onPress={() => router.push("/staff/create")}>
            <Ionicons name="add-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.countText}>{staff.length} staff members</Text>
      <FlatList
        data={staff}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStaff(); }}
            colors={[GOLD]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No staff found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: GOLD, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  countText: { fontSize: 12, color: "#888", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 20, fontWeight: "700", color: "#fff" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: "700", color: "#111" },
  email: { fontSize: 12, color: "#888" },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#aaa" },
});