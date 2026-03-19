import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";

const { width } = Dimensions.get("window");

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
  purple: "#7C6FCD",
  purpleBg: "#EDEAFD",
  green: "#4CAF89",
  greenBg: "#E8F8F2",
  orange: "#E07C3A",
  orangeBg: "#FFF0E8",
  blue: "#4A90D9",
  blueBg: "#E8F2FF",
};

const MENU_PERMISSIONS = {
  stores: ["Sales_Executive", "Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"],
  storeSearch: ["Sales_Executive", "Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"],
  staff: ["Sales_Admin", "Sales_Manager", "Director", "Deputy_Director", "HR_Admin"],
};

// ─── Divider ──────────────────────────────────────────────────────────────────
const HDivider = ({ style }) => <View style={[styles.hDivider, style]} />;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ value, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <View style={styles.statMiniDivider} />
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Menu Card ────────────────────────────────────────────────────────────────
const MenuCard = ({ icon, label, sub, color, iconBg, onPress }) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.menuText}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuSub}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={15} color="#D0D0D0" />
  </TouchableOpacity>
);

// ─── Store Row ────────────────────────────────────────────────────────────────
const StoreRow = ({ store, isLast }) => (
  <>
    <TouchableOpacity
      style={styles.storeRow}
      activeOpacity={0.8}
      onPress={() => router.push(`/stores/${store.store_id}`)}
    >
      <View style={styles.storeIconBox}>
        <Ionicons name="storefront-outline" size={18} color={C.gold} />
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{store.store_name}</Text>
        <Text style={styles.storeAddr}>{store.district}, {store.city}</Text>
      </View>
      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>{store.store_type}</Text>
      </View>
    </TouchableOpacity>
    {!isLast && <HDivider style={{ marginHorizontal: 16 }} />}
  </>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );

  const canAccess = (key) => MENU_PERMISSIONS[key]?.includes(user?.role);

  const menuItems = [
    canAccess("stores") && {
      icon: "storefront-outline",
      label: "My Stores",
      sub: `${stores.length} assigned`,
      color: C.purple,
      iconBg: C.purpleBg,
      href: "/(tabs)/stores",
    },
    canAccess("storeSearch") && {
      icon: "search-outline",
      label: "Store Search",
      sub: "Find any store",
      color: C.blue,
      iconBg: C.blueBg,
      href: "/stores/search",
    },
    canAccess("staff") && {
      icon: "people-outline",
      label: "Staff",
      sub: "Manage accounts",
      color: C.green,
      iconBg: C.greenBg,
      href: "/(tabs)/staff",
    },
    {
      icon: "person-outline",
      label: "Profile",
      sub: "Account settings",
      color: C.orange,
      iconBg: C.orangeBg,
      href: "/(tabs)/profile",
    },
  ].filter(Boolean);

  const storeStats = [
    { label: "Total", value: stores.length },
    { label: "Grocery", value: stores.filter((s) => s.store_type === "grocery").length },
    { label: "Supermarket", value: stores.filter((s) => s.store_type === "supermarket").length },
    { label: "Agency", value: stores.filter((s) => s.store_type === "agency").length },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 36 }}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Top row: name + settings */}
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="settings-outline" size={19} color="rgba(255,255,255,0.88)" />
          </TouchableOpacity>
        </View>

        {/* Role divider — giong OR divider */}
        <View style={styles.roleDividerRow}>
          <View style={styles.headerDivider} />
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{user?.role?.replace(/_/g, " ")}</Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Stats grid */}
        {canAccess("stores") && (
          <View style={styles.statsRow}>
            {storeStats.map((s, i) => (
              <View key={s.label} style={{ flex: 1, flexDirection: "row" }}>
                <StatCard value={s.value} label={s.label} />
                {i < storeStats.length - 1 && (
                  <View style={styles.statVertDivider} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── BODY ── */}
      <View style={styles.body}>

        {/* Quick Access */}
        <SectionHeader title="Quick Access" />
        <Text style={styles.sectionSub}>Navigate to your most-used features.</Text>

        <View style={styles.cardContainer}>
          {menuItems.map((item, i) => (
            <View key={item.label}>
              <MenuCard
                icon={item.icon}
                label={item.label}
                sub={item.sub}
                color={item.color}
                iconBg={item.iconBg}
                onPress={() => router.push(item.href)}
              />
              {i < menuItems.length - 1 && (
                <HDivider style={{ marginHorizontal: 16 }} />
              )}
            </View>
          ))}
        </View>

        {/* Recent Stores */}
        {canAccess("stores") && stores.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <SectionHeader
              title="Recent Stores"
              action="See all"
              onAction={() => router.push("/(tabs)/stores")}
            />
            <Text style={styles.sectionSub}>Your recently assigned locations.</Text>

            <View style={styles.cardContainer}>
              {stores.slice(0, 3).map((store, i) => (
                <StoreRow
                  key={store.store_id}
                  store={store}
                  isLast={i === Math.min(stores.length, 3) - 1}
                />
              ))}
            </View>
          </View>
        )}

        {/* Overview Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="bar-chart-outline" size={22} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Overview Report</Text>
              <Text style={styles.bannerSub}>Detailed analytics across all stores.</Text>
            </View>
          </View>
          <HDivider style={{ backgroundColor: C.goldBorder }} />
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>View Report</Text>
            <Ionicons name="arrow-forward" size={13} color={C.gold} />
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
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
    alignItems: "flex-start",
    marginBottom: 18,
  },
  greeting: {
    fontSize: 13,
    color: C.goldMuted,
    fontWeight: "400",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  settingsBtn: {
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
    backgroundColor: C.goldOverlay,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.goldOverlayBorder,
  },
  roleText: {
    fontSize: 11,
    color: C.white,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.goldOverlay,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.goldOverlayBorder,
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
    color: C.goldMuted,
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statVertDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 12,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  sectionAction: {
    fontSize: 13,
    color: C.gold,
    fontWeight: "600",
  },
  sectionSub: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 14,
    marginLeft: 11,
    lineHeight: 19,
  },

  // Shared card container
  cardContainer: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  // Menu card
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 13,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: C.muted,
  },

  // Divider
  hDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Store row
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.goldBg,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  storeAddr: {
    fontSize: 11,
    color: C.muted,
  },
  typeBadge: {
    backgroundColor: C.goldBg,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  typeText: {
    fontSize: 10,
    color: C.goldDark,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Banner
  banner: {
    marginTop: 28,
    backgroundColor: C.goldBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.goldBorder,
    overflow: "hidden",
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 13,
  },
  bannerIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(200,134,10,0.10)",
    borderWidth: 1,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.goldDark,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  bannerSub: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 17,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  bannerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.gold,
  },
});