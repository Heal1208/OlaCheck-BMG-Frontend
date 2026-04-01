import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { getUser } from "../../src/services/authService";

const GOLD = "#C8960C";

// Admin   : toàn quyền — thấy tất cả tabs
// Manager : vận hành — thấy stores, alerts, staff, profile
// Staff   : nhân viên tuyến — chỉ stores và profile
const TABS_BY_ROLE = {
    Admin: ["index", "stores", "alerts", "staff", "profile"],
    Manager: ["index", "stores", "alerts", "staff", "profile"],
    Staff: ["index", "stores", "profile"],
};

const ALL_TABS = [
    { name: "index", title: "Home", icon: "home-outline" },
    { name: "stores", title: "Stores", icon: "storefront-outline" },
    { name: "alerts", title: "Alerts", icon: "warning-outline" },
    { name: "staff", title: "Staff", icon: "people-outline" },
    { name: "profile", title: "Profile", icon: "person-outline" },
];

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
                tabBarActiveTintColor: GOLD,
                tabBarInactiveTintColor: "#aaa",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#f0f0f0",
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            {ALL_TABS.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        href: allowedTabs.includes(tab.name) ? undefined : null,
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name={tab.icon} size={size} color={color} />
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}