import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, Animated } from "react-native";
import { UI } from "../../constants/theme";
import { getUser } from "../../src/services/authService";
import { getAlerts } from "../../src/services/checkinService";

// ─── Tabs hiển thị theo role ──────────────────────────────────
const TABS_BY_ROLE = {
  Admin: ["index", "stores", "alerts", "staff", "schedule", "stats", "profile"],
  Manager: ["index", "stores", "alerts", "staff", "schedule", "stats", "profile"],
  Staff: ["index", "stores", "alerts", "profile"],
};

// ─── Định nghĩa tất cả tabs ───────────────────────────────────
const ALL_TABS = [
  {
    name: "index",
    title: "Home",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    name: "stores",
    title: "Stores",
    icon: "storefront-outline",
    activeIcon: "storefront",
  },
  {
    name: "alerts",
    title: "Activity",
    icon: "notifications-outline",
    activeIcon: "notifications",
    hasBadge: true,
  },
  {
    name: "staff",
    title: "Staff",
    icon: "people-outline",
    activeIcon: "people",
  },
  {
    name: "schedule",
    title: "Schedule",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "stats",
    title: "Stats",
    icon: "bar-chart-outline",
    activeIcon: "bar-chart",
  },
  {
    name: "profile",
    title: "Profile",
    icon: "person-outline",
    activeIcon: "person",
  },
];

// ─── Desktop Sidebar Component (Collapsible Side Navigation) ────
function Sidebar({ allowedTabs, alertsCount }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  
  // Extract active tab name from URL segments
  const activeTab = segments.length > 1 ? segments[1] : "index";

  const handleNavigation = (tabName) => {
    router.navigate(`/(tabs)/${tabName === "index" ? "" : tabName}`);
  };

  return (
    <View style={[styles.sidebar, isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed]}>
      <View style={[styles.sidebarHeader, !isExpanded && { justifyContent: "center", paddingHorizontal: 0 }]}>
        <TouchableOpacity style={styles.sidebarToggleBtn} onPress={() => setIsExpanded(!isExpanded)}>
          <Ionicons name="menu-outline" size={24} color={UI.light.primaryDark} />
        </TouchableOpacity>
        {isExpanded && <Text style={styles.sidebarTitle}>OlaCheck</Text>}
      </View>

      <View style={styles.sidebarContent}>
        {ALL_TABS.filter((t) => allowedTabs.includes(t.name)).map((tab) => {
          const focused = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.sidebarItem, 
                focused && styles.sidebarItemActive, 
                !isExpanded && { justifyContent: "center", paddingHorizontal: 0 }
              ]}
              onPress={() => handleNavigation(tab.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.sidebarIconWrap, focused && styles.sidebarIconWrapActive]}>
                <Ionicons
                  name={focused ? tab.activeIcon : tab.icon}
                  size={20}
                  color={focused ? "#FFFFFF" : UI.light.inactive}
                />
                {tab.hasBadge && alertsCount > 0 && <View style={styles.alertBadge} />}
              </View>
              {isExpanded && (
                <Text style={[styles.sidebarLabel, focused && styles.sidebarLabelActive]}>
                  {tab.title}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tab Icon Component (Mobile) ──────────────────────────────
function TabIcon({ focused, icon, activeIcon, title, badge }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? activeIcon : icon}
          size={20}
          color={focused ? "#FFFFFF" : UI.light.inactive}
        />
        {badge && <View style={styles.alertBadge} />}
      </View>
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

// ─── Main Layout ──────────────────────────────────────────────
export default function TabsLayout() {
  const [role, setRole] = useState(null);
  const [alertsCount, setAlertsCount] = useState(0);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  useEffect(() => {
    getUser().then((u) => setRole(u?.role ?? null));
  }, []);

  useEffect(() => {
    if (!role) return;
    const loadAlerts = async () => {
      try {
        const result = await getAlerts({ is_resolved: "0" });
        if (result.success) {
          const list = result.data?.alerts ?? [];
          setAlertsCount(Array.isArray(list) ? list.length : 0);
        } else {
          setAlertsCount(0);
        }
      } catch {
        setAlertsCount(0);
      }
    };
    loadAlerts();
  }, [role]);

  const allowedTabs = TABS_BY_ROLE[role] ?? ["index", "profile"];
  const visibleCount = ALL_TABS.filter((t) => allowedTabs.includes(t.name)).length;

  return (
    <View style={[styles.layoutWrapper, { flexDirection: isDesktop ? "row" : "column" }]}>
      {isDesktop && <Sidebar allowedTabs={allowedTabs} alertsCount={alertsCount} />}
      
      <View style={styles.mainContent}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            // Hide bottom tab bar completely on desktop
            tabBarStyle: isDesktop
              ? { display: "none" }
              : [
                  styles.tabBar,
                  visibleCount >= 6 && styles.tabBarCompact,
                ],
          }}
        >
          {ALL_TABS.map((tab) => {
            const isAllowed = allowedTabs.includes(tab.name);
            return (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={{
                  title: tab.title,
                  href: isAllowed ? undefined : null,
                  tabBarIcon: ({ focused }) => (
                    <TabIcon
                      focused={focused}
                      icon={tab.icon}
                      activeIcon={tab.activeIcon}
                      title={tab.title}
                      badge={tab.hasBadge && alertsCount > 0}
                    />
                  ),
                }}
              />
            );
          })}
        </Tabs>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  layoutWrapper: {
    flex: 1,
    backgroundColor: UI.light.background,
  },
  mainContent: {
    flex: 1,
  },
  
  // ─── Desktop Collapsible Sidebar Styles ───
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderColor: UI.light.border,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 0 },
    zIndex: 10,
  },
  sidebarExpanded: {
    width: 260,
  },
  sidebarCollapsed: {
    width: 80,
    alignItems: "center",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 16,
  },
  sidebarToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: UI.light.primaryDark,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
    gap: 16,
  },
  sidebarItemActive: {
    backgroundColor: UI.light.primarySoft,
  },
  sidebarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarIconWrapActive: {
    backgroundColor: UI.light.primaryDark,
  },
  sidebarLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: UI.light.inactive,
  },
  sidebarLabelActive: {
    color: UI.light.primaryDark,
    fontWeight: "800",
  },

  // ─── Bottom Tab Styles ───
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 78 : 64,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    paddingHorizontal: 6,
    backgroundColor: UI.light.tint ?? UI.light.card,
    borderTopWidth: 0,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#C9D2E3",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  tabBarCompact: {
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconWrapActive: {
    backgroundColor: UI.light.primaryDark,
  },
  alertBadge: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI.light.alert ?? "#FF4D4F",
    borderWidth: 1.5,
    borderColor: UI.light.tint ?? "#fff",
    top: 5,
    right: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: UI.light.inactive,
    textAlign: "center",
  },
  tabLabelActive: {
    color: UI.light.primaryDark,
    fontWeight: "700",
  },
});