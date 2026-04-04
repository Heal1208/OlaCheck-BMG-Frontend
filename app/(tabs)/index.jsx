import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TabHero from "../../components/TabHero";
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  success: "#29B36A",
  danger: "#FF8A00",
  border: "#E9EDF5",
  shadow: "#D9DEE8",
};

const CAN_ACCESS = {
  stores: ["Admin", "Manager", "Staff"],
  storeSearch: ["Admin", "Manager", "Staff"],
  alerts: ["Admin", "Manager"],
  staff: ["Admin", "Manager"],
};

const ROLE_BADGE = {
  Admin: { bg: "#FFFBE0", text: "#8A7E18", label: "Admin" },
  Manager: { bg: "#FFFBE0", text: "#8A7E18", label: "Manager" },
  Staff: { bg: "#FFFBE0", text: "#8A7E18", label: "Staff" },
};

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUser(), getAssignedStores()]).then(([u, s]) => {
      setUser(u);
      if (s.success) {
        setStores(s.data.stores);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  const canAccess = (key) => CAN_ACCESS[key]?.includes(user?.role);
  const roleBadge = ROLE_BADGE[user?.role] || ROLE_BADGE.Staff;
  const groceryCount = stores.filter((store) => store.store_type === "grocery").length;
  const supermarketCount = stores.filter((store) => store.store_type === "supermarket").length;
  const agencyCount = stores.filter((store) => store.store_type === "agency").length;
  const alertCount = Math.max(agencyCount, 1);
  const greetingName = user?.full_name || "User";

  const stats = [
    {
      label: "Stores",
      value: stores.length,
      icon: "storefront-outline",
      change: `+${Math.max(stores.length, 1)} active`,
    },
    {
      label: "Grocery",
      value: groceryCount,
      icon: "basket-outline",
      change: `+${Math.max(groceryCount, 1)} checked`,
    },
    {
      label: "Supermarket",
      value: supermarketCount,
      icon: "cart-outline",
      change: `+${Math.max(supermarketCount, 1)} ready`,
    },
    {
      label: "Agency",
      value: agencyCount,
      icon: "business-outline",
      change: `+${Math.max(agencyCount, 1)} online`,
    },
  ];

  const quickActions = [
    canAccess("stores") && {
      label: "My Stores",
      icon: "storefront-outline",
      href: "/(tabs)/stores",
    },
    canAccess("storeSearch") && {
      label: "Search",
      icon: "search-outline",
      href: "/stores/search",
    },
    canAccess("alerts") && {
      label: "Alerts",
      icon: "notifications-outline",
      href: "/(tabs)/alerts",
    },
    canAccess("staff") && {
      label: "Staff",
      icon: "people-outline",
      href: "/(tabs)/staff",
    },
    {
      label: "Profile",
      icon: "person-outline",
      href: "/(tabs)/profile",
    },
  ].filter(Boolean);
  const shouldShowQuickActions = quickActions.length > 1;

  const highlightStores = stores.slice(0, 3);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TabHero
          eyebrow="Dashboard"
          title="Home"
          right={(
            <TouchableOpacity
              style={styles.notifyButton}
              onPress={() => (canAccess("alerts") ? router.push("/(tabs)/alerts") : router.push("/(tabs)/profile"))}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {canAccess("alerts") && <View style={styles.notifyDot} />}
            </TouchableOpacity>
          )}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.heroIdentity}>
              <View style={styles.logoWrap}>
                <Image
                source={require("../../assets/images/olasun-leaf.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroGreeting}>Hello,</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {greetingName}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                  <Text style={[styles.roleText, { color: roleBadge.text }]}>
                    {roleBadge.label}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.searchBar}
              onPress={() => router.push(canAccess("storeSearch") ? "/stores/search" : "/(tabs)/stores")}
            >
              <Ionicons name="search-outline" size={18} color="##E7DA66" />
              <TextInput
                editable={false}
                pointerEvents="none"
                value=""
                placeholder="Search stores, staff, alerts..."
                placeholderTextColor="##E7DA66"
                style={styles.searchInput}
              />
            </TouchableOpacity>
          </View>
        </TabHero>

        <View style={styles.section}>
          <View style={styles.statsGrid}>
            {stats.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <View style={styles.statIconWrap}>
                  <Ionicons name={item.icon} size={18} color={UI.primaryDark} />
                </View>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statChange}>{item.change}</Text>
              </View>
            ))}
          </View>
        </View>

        {shouldShowQuickActions && (
          <View style={styles.section}>
            <View style={styles.quickCard}>
              <Text style={styles.quickTitle}>Quick Actions</Text>
              <View style={styles.quickGrid}>
                {quickActions.slice(0, 4).map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.quickAction}
                    onPress={() => router.push(item.href)}
                  >
                    <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                    <Text style={styles.quickActionLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <View style={styles.noticeTitleWrap}>
                <Ionicons name="alert-circle-outline" size={18} color={UI.danger} />
                <Text style={styles.noticeTitle}>Need Attention</Text>
              </View>
              <View style={styles.noticeDot} />
            </View>

            {highlightStores.length > 0 ? (
              highlightStores.map((store) => (
                <TouchableOpacity
                  key={store.store_id}
                  style={styles.noticeItem}
                  onPress={() => router.push("/(tabs)/stores")}
                >
                  <View>
                    <Text style={styles.noticeItemTitle} numberOfLines={1}>
                      {store.store_name}
                    </Text>
                    <Text style={styles.noticeItemMeta} numberOfLines={1}>
                      {store.district}, {store.city}
                    </Text>
                  </View>
                  <View style={styles.noticeBadge}>
                    <Text style={styles.noticeBadgeText}>{alertCount}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noticeEmpty}>
                <Text style={styles.noticeEmptyTitle}>No store data yet</Text>
                <Text style={styles.noticeEmptyText}>
                  Assigned stores will show up here for quick review.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI.background,
  },
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  content: {
    paddingBottom: 132,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.background,
  },
  welcomeCard: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  heroIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 13,
    color: "#FFFCE7",
    marginBottom: 2,
  },
  heroName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5B5214",
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  notifyButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4D4F",
    borderWidth: 2,
    borderColor: UI.primary,
    position: "absolute",
    top: 8,
    right: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: "#5B5214",
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  statCard: {
    width: "47.8%",
    backgroundColor: UI.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: UI.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: UI.muted,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: UI.text,
  },
  statChange: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: UI.success,
  },
  quickCard: {
    backgroundColor: UI.primaryDark,
    borderRadius: 20,
    padding: 16,
    shadowColor: UI.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  quickTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: "47.8%",
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  quickActionLabel: {
    color: "#5B5214",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  noticeCard: {
    backgroundColor: "#FFFDF6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFE0A8",
    padding: 16,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  noticeTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: UI.text,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI.primary,
  },
  noticeItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  noticeItemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: UI.text,
  },
  noticeItemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: UI.muted,
  },
  noticeBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  noticeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: UI.primaryDark,
  },
  noticeEmpty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },
  noticeEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: UI.text,
  },
  noticeEmptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: UI.muted,
  },
});
