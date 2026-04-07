import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";
import { UI } from "../../constants/theme";

const CAN_ACCESS = {
  stores: ["Admin", "Manager", "Staff"],
  storeSearch: ["Admin", "Manager", "Staff"],
  alerts: ["Admin", "Manager"],
  staff: ["Admin", "Manager"],
};

const ROLE_BADGE = {
  Admin: { bg: "#FFFDF1", text: "#24324A", label: "Admin" },
  Manager: { bg: "#FFFDF1", text: "#24324A", label: "Manager" },
  Staff: { bg: "#FFFDF1", text: "#24324A", label: "Staff" },
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
        <SkeletonPulse style={styles.loadingSkeleton} />
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
            <Ionicons name="notifications-outline" size={22} color={UI.primaryDark} />
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
                <View style={styles.noticeEmptyIconWrap}>
                  <Ionicons name="sparkles-outline" size={36} color={UI.primaryDark} />
                </View>
                <Text style={styles.noticeEmptyTitle}>No store data yet</Text>
                <Text style={styles.noticeEmptyText}>
                  Assigned stores will show up here for quick review.
                </Text>
                <TouchableOpacity
                  style={styles.noticeEmptyButton}
                  onPress={() => router.push("/(tabs)/stores")}
                >
                  <Text style={styles.noticeEmptyButtonText}>Explore Stores</Text>
                </TouchableOpacity>
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
    backgroundColor: UI.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: UI.light.background,
  },
  content: {
    paddingBottom: 132,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.light.background,
  },
  loadingSkeleton: {
    width: "70%",
    height: 28,
    borderRadius: 16,
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
    borderColor: UI.light.primary,
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
    color: UI.light.text,
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
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: UI.light.shadow,
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
    color: UI.light.muted,
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
    color: UI.light.success,
  },
  quickCard: {
    backgroundColor: UI.primaryDark,
    borderRadius: 20,
    padding: 16,
    shadowColor: UI.light.primaryDark,
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
    color: UI.text,
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
    color: UI.light.text,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI.light.primary,
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
    color: UI.light.text,
  },
  noticeItemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: UI.light.muted,
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
    color: UI.light.primaryDark,
  },
  noticeEmpty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  noticeEmptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F7E8B6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  noticeEmptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: UI.light.text,
  },
  noticeEmptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: UI.light.muted,
    textAlign: "center",
  },
  noticeEmptyButton: {
    marginTop: 16,
    minWidth: "60%",
    borderRadius: 14,
    backgroundColor: UI.light.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  noticeEmptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
