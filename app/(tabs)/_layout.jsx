import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
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

// ─── Tab Icon Component ───────────────────────────────────────
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

  // Load user role
  useEffect(() => {
    getUser().then((u) => setRole(u?.role ?? null));
  }, []);

  // Load unresolved alert count for badge
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

  // Tính số tab visible để điều chỉnh width
  const visibleCount = ALL_TABS.filter((t) => allowedTabs.includes(t.name)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          // Khi có nhiều tab (Admin/Manager có 7 tab) thì giảm padding
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
              // Nếu không được phép thì ẩn khỏi tab bar (href: null)
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
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
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

  // Compact mode: khi có >= 6 tab, giảm paddingHorizontal
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