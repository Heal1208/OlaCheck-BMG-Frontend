import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";

const PURPLE = "#5B4FD9";

const MENU_PERMISSIONS = {
  stores: ["Sales_Executive", "Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"],
  storeSearch: ["Sales_Executive", "Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"],
  staff: ["Sales_Admin", "Sales_Manager", "Director", "Deputy_Director", "HR_Admin"],
};

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUser(), getAssignedStores()]).then(([u, s]) => {
      setUser(u);
      if (s.success) setStores(s.data.stores);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={PURPLE} /></View>;

  const canAccess = (key) => MENU_PERMISSIONS[key]?.includes(user?.role);

  const menuItems = [
    canAccess("stores") && {
      icon: "storefront-outline", label: "My Stores",
      sub: `${stores.length} assigned`, color: PURPLE, href: "/(tabs)/stores",
    },
    canAccess("storeSearch") && {
      icon: "search-outline", label: "Store Search",
      sub: "Find any store", color: "#2D9CDB", href: "/stores/search",
    },
    canAccess("staff") && {
      icon: "people-outline", label: "Staff",
      sub: "Manage accounts", color: "#27AE60", href: "/(tabs)/staff",
    },
    {
      icon: "person-outline", label: "Profile",
      sub: "Account settings", color: "#F2994A", href: "/(tabs)/profile",
    },
  ].filter(Boolean);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.replace("_", " ")}</Text>
          </View>
        </View>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>O</Text>
        </View>
      </View>

      {canAccess("stores") && (
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: stores.length, color: "#111" },
            { label: "Grocery", value: stores.filter(s => s.store_type === "grocery").length, color: "#F57C00" },
            { label: "Supermarket", value: stores.filter(s => s.store_type === "supermarket").length, color: "#2E7D32" },
            { label: "Agency", value: stores.filter(s => s.store_type === "agency").length, color: "#1565C0" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuCard} onPress={() => router.push(item.href)}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + "18" }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {canAccess("stores") && stores.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Stores</Text>
          {stores.slice(0, 3).map((store) => (
            <View key={store.store_id} style={styles.storeCard}>
              <View style={styles.storeIcon}>
                <Ionicons name="storefront-outline" size={20} color={PURPLE} />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.store_name}</Text>
                <Text style={styles.storeAddr}>{store.district}, {store.city}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{store.store_type}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: PURPLE, padding: 24, paddingTop: 56, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 14, color: "#ffffff99" },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: "#ffffff22", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start" },
  roleText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#ffffff22", alignItems: "center", justifyContent: "center" },
  logoLetter: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statsRow: { flexDirection: "row", padding: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10, marginBottom: 24 },
  menuCard: { width: "47%", backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  menuIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  menuLabel: { fontSize: 14, fontWeight: "700", color: "#111" },
  menuSub: { fontSize: 12, color: "#888", marginTop: 2 },
  storeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, gap: 12 },
  storeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F0F0FF", alignItems: "center", justifyContent: "center" },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 14, fontWeight: "600", color: "#111" },
  storeAddr: { fontSize: 12, color: "#888", marginTop: 2 },
  typeBadge: { backgroundColor: "#F0F0FF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 11, color: PURPLE, fontWeight: "600" },
});