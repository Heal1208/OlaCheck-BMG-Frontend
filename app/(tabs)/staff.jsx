import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStaffList, deleteStaff } from "../../src/services/staffService";
import { getUser } from "../../src/services/authService";

const GOLD = "#C8960C";
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item.is_active ? GOLD : "#ccc" }]}>
        <Text style={styles.avatarLetter}>{item.full_name?.[0]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role_name?.replace("_", " ")}</Text>
          </View>
          {!item.is_active && (
            <View style={[styles.roleBadge, { backgroundColor: "#FFEBEE" }]}>
              <Text style={[styles.roleText, { color: "#E53935" }]}>Inactive</Text>
            </View>
          )}
        </View>
      </View>
      {isManager && item.is_active && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#E53935" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff</Text>
        <TouchableOpacity onPress={() => router.push("/staff/create")}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
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
  roleBadge: { backgroundColor: "#FFF8E8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11, color: GOLD, fontWeight: "600" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 14, color: "#aaa" },
});