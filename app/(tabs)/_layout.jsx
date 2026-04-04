import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getUser } from "../../src/services/authService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#E7DA66",
  background: "#FFFFFF",
  inactive: "#8A94A6",
};

const TABS_BY_ROLE = {
  Admin: ["index", "stores", "alerts", "staff", "profile"],
  Manager: ["index", "stores", "alerts", "staff", "profile"],
  Staff: ["index", "stores", "profile"],
};

const ALL_TABS = [
  { name: "index", title: "Home", icon: "home-outline", activeIcon: "home" },
  { name: "stores", title: "Stores", icon: "storefront-outline", activeIcon: "storefront" },
  { name: "alerts", title: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { name: "staff", title: "Staff", icon: "people-outline", activeIcon: "people" },
  { name: "profile", title: "Profile", icon: "person-outline", activeIcon: "person" },
];

function TabIcon({ focused, icon, activeIcon, title }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? activeIcon : icon}
          size={20}
          color={focused ? "#FFFFFF" : UI.inactive}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{title}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    getUser().then((u) => setRole(u?.role));
  }, []);

  const allowedTabs = TABS_BY_ROLE[role] || ["index", "profile"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {ALL_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: allowedTabs.includes(tab.name) ? undefined : null,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={tab.icon}
                activeIcon={tab.activeIcon}
                title={tab.title}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    height: 76,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: UI.background,
    borderTopWidth: 0,
    borderRadius: 24,
    shadowColor: "#C9D2E3",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  tabItem: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: UI.primaryDark,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: UI.inactive,
  },
  tabLabelActive: {
    color: UI.primaryDark,
  },
});
