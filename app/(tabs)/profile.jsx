import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { changePassword, clearSession, getUser, logout } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";
import { getStaffList } from "../../src/services/staffService";
import { getAlerts, getCheckins } from "../../src/services/checkinService";
import { UI } from "../../constants/theme";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useAlert();
  const [assignedStores, setAssignedStores] = useState([]);
  const [staffMetrics, setStaffMetrics] = useState({ total: 0, active: 0 });
  const [teamPulse, setTeamPulse] = useState({ online: 0, offline: 0 });
  const [monthlyHandled, setMonthlyHandled] = useState(0);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [planDetails, setPlanDetails] = useState({ name: "OlaCheck Core", expiresAt: null });
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    setPlanDetails({
      name: user.plan_name || user.subscription_plan || "OlaCheck Core",
      expiresAt:
        user.plan_expires_at ||
        user.subscription_expires_at ||
        user.subscription_end ||
        null,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadInsights = async () => {
      setLoadingInsights(true);
      try {
        const storesRes = await getAssignedStores();
        const storesList = storesRes.success ? storesRes.data.stores || [] : [];
        if (!cancelled) {
          setAssignedStores(storesList);
        }

        if (user.role === "Admin") {
          const staffsRes = await getStaffList();
          if (!cancelled && staffsRes.success) {
            const fetchedStaff = staffsRes.data.staff || [];
            setStaffMetrics({
              total: fetchedStaff.length,
              active: fetchedStaff.filter((person) => person.is_active).length,
            });
          }
        }

        if (user.role === "Manager") {
          const totalTeam = storesList.reduce(
            (sum, store) => sum + (store.staff_count ?? 0),
            0
          );
          const onlineTeam = storesList.reduce(
            (sum, store) => sum + (store.staff_online_count ?? 0),
            0
          );
          if (!cancelled) {
            setTeamPulse({
              online: onlineTeam,
              offline: Math.max(totalTeam - onlineTeam, 0),
            });
          }
          const alertsRes = await getAlerts({ status: "handled" });
          if (!cancelled && alertsRes.success) {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const monthly = (alertsRes.data.alerts || []).filter((alert) => {
              const reference = alert.handled_at || alert.created_at;
              if (!reference) return false;
              const timestamp = new Date(reference);
              return timestamp >= monthStart;
            }).length;
            setMonthlyHandled(monthly);
          }
        }

        if (user.role === "Staff") {
          const checkinsRes = await getCheckins({
            user_id: user.user_id,
            limit: 5,
          });
          if (!cancelled && checkinsRes.success) {
            setRecentCheckins(checkinsRes.data.checkins || []);
          }
        }
      } catch (error) {
        console.warn("Profile insights", error);
      } finally {
        if (!cancelled) {
          setLoadingInsights(false);
        }
      }
    };

    loadInsights();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showAlert("Error", "Please fill in all fields.");
      return;
    }
    if (newPw !== confirmPw) {
      showAlert("Error", "New passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      showAlert("Error", "New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPw, newPw);
      if (result.success) {
        showAlert("Success", "Password changed successfully.", [
          {
            text: "OK",
            onPress: () => {
              setShowForm(false);
              setCurrentPw("");
              setNewPw("");
              setConfirmPw("");
            },
          },
        ]);
      } else {
        showAlert("Failed", result.message);
      }
    } catch {
      showAlert("Error", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {}
          await clearSession();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleSystemConfig = () => router.push("/settings/system");
  const handleActivityLog = () => router.push("/settings/activity-log");

  const planExpiryLabel = planDetails.expiresAt
    ? new Date(planDetails.expiresAt).toLocaleDateString("vi-VN")
    : "N/A";
  const activeStoreCount = assignedStores.filter((store) =>
    typeof store.is_active === "boolean" ? store.is_active : true
  ).length;
  const totalStores = assignedStores.length;
  const primaryStore = assignedStores[0];
  const managerOnline = teamPulse.online;
  const managerOffline = teamPulse.offline;
  const kpiScore = Math.min(100, 40 + recentCheckins.length * 12);
  const managerMonthlyHandled = monthlyHandled;
  const staffContactName =
    primaryStore?.manager_name ||
    primaryStore?.owner_name ||
    primaryStore?.store_name ||
    "Primary Store";
  const staffContactPhone =
    primaryStore?.manager_phone ||
    primaryStore?.owner_phone ||
    primaryStore?.phone ||
    "N/A";

  if (!user) {
    return (
      <View style={styles.center}>
        <SkeletonPulse style={styles.loadingSkeleton} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <TabHero eyebrow="Account" title="Profile">
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user.full_name?.[0]}</Text>
          </View>
          <Text style={styles.name}>{user.full_name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role?.replace("_", " ")}</Text>
          </View>
        </View>
      </TabHero>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Overview</Text>
        <View style={styles.planCard}>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Plan</Text>
            <Text style={styles.planValue}>{planDetails.name}</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Expires</Text>
            <Text style={styles.planValue}>{planExpiryLabel}</Text>
          </View>
          <Text style={styles.planSub}>
            Keep your package current to unlock the full suite of analytics and automation.
          </Text>
        </View>
      </View>

      {user.role === "Admin" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enterprise Insights</Text>
          {loadingInsights ? (
            <View style={styles.metricRow}>
              <SkeletonPulse style={[styles.metricSkeleton, { marginRight: 10 }]} />
              <SkeletonPulse style={styles.metricSkeleton} />
            </View>
          ) : (
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Active Stores</Text>
                <Text style={styles.metricValue}>{activeStoreCount}</Text>
                <Text style={styles.metricNote}>{totalStores} tracked</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Team Members</Text>
                <Text style={styles.metricValue}>{staffMetrics.total}</Text>
                <Text style={styles.metricNote}>{staffMetrics.active} active now</Text>
              </View>
            </View>
          )}
          <View style={styles.adminActions}>
            <TouchableOpacity style={styles.adminActionButton} onPress={handleSystemConfig}>
              <Ionicons name="settings-outline" size={18} color={UI.light.primaryDark} />
              <Text style={styles.adminActionText}>System Config</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminActionButton} onPress={handleActivityLog}>
              <Ionicons name="book-outline" size={18} color={UI.light.primaryDark} />
              <Text style={styles.adminActionText}>Activity Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user.role === "Manager" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Snapshot</Text>
          {loadingInsights ? (
            <SkeletonPulse style={styles.metricSkeleton} />
          ) : (
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Assigned Stores</Text>
                <Text style={styles.metricValue}>{totalStores}</Text>
                <Text style={styles.metricNote}>Coverage breadth</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Team Pulse</Text>
                <Text style={styles.metricValue}>
                  {managerOnline} / {managerOffline}
                </Text>
                <Text style={styles.metricNote}>Online / Offline</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Reports This Month</Text>
                <Text style={styles.metricValue}>{managerMonthlyHandled}</Text>
                <Text style={styles.metricNote}>Alerts handled</Text>
              </View>
            </View>
          )}
          <View style={styles.storeList}>
            {assignedStores.length === 0 && (
              <Text style={styles.emptyText}>No stores assigned yet for your scope.</Text>
            )}
            {assignedStores.slice(0, 4).map((store) => (
              <View key={store.store_id} style={styles.storeCard}>
                <Text style={styles.storeName}>{store.store_name}</Text>
                <Text style={styles.storeMeta}>{store.district}, {store.city}</Text>
                <Text style={styles.storeDetail}>
                  {store.manager_name || store.owner_name || "Manager"} · {store.manager_phone || store.phone || "No phone"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {user.role === "Staff" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Operations</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>KPI Completion</Text>
              <Text style={styles.metricValue}>{kpiScore}%</Text>
              <Text style={styles.metricNote}>{recentCheckins.length} check-ins recent</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Main Store</Text>
              <Text style={styles.metricValue}>{primaryStore?.store_name ?? "Assigned store"}</Text>
              <Text style={styles.metricNote}>
                {primaryStore ? `${primaryStore.district}, ${primaryStore.city}` : "No store data"}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={18} color={UI.light.primaryDark} />
            </View>
            <View style={[styles.infoBody, { gap: 4 }]}>
              <Text style={styles.infoLabel}>Store Contact</Text>
              <Text style={styles.infoValue}>{staffContactName}</Text>
              <Text style={styles.infoValue}>{staffContactPhone}</Text>
            </View>
          </View>
          <View style={styles.checkinColumn}>
            <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Check-in History</Text>
            {recentCheckins.length === 0 && (
              <Text style={styles.emptyText}>No check-ins recorded yet.</Text>
            )}
            {recentCheckins.map((checkin) => (
              <View key={checkin.checkin_id || checkin.id} style={styles.checkinRow}>
                <Text style={styles.checkinTime}>
                  {new Date(checkin.check_time || checkin.created_at || Date.now()).toLocaleString("vi-VN")}
                </Text>
                <Text style={styles.checkinNote}>{checkin.note || "Check-in logged"}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setShowForm((value) => !value)}>
          <View style={styles.actionLeft}>
            <View style={styles.infoIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={UI.light.primaryDark} />
            </View>
            <Text style={styles.actionLabel}>Change Password</Text>
          </View>
          <Ionicons
            name={showForm ? "chevron-up-outline" : "chevron-down-outline"}
            size={18}
            color={UI.light.muted}
          />
        </TouchableOpacity>

        {showForm && (
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="#A9B3C3"
                secureTextEntry={!showCur}
                value={currentPw}
                onChangeText={setCurrentPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowCur((value) => !value)}>
                <Ionicons name={showCur ? "eye-outline" : "eye-off-outline"} size={18} color={UI.light.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#A9B3C3"
                secureTextEntry={!showNew}
                value={newPw}
                onChangeText={setNewPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNew((value) => !value)}>
                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={18} color={UI.light.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#A9B3C3"
                secureTextEntry={!showConfirm}
                value={confirmPw}
                onChangeText={setConfirmPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm((value) => !value)}>
                <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={18} color={UI.light.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.light.background,
  },
  content: {
    paddingBottom: 118,
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
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 22,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: "800",
    color: UI.light.primaryDark,
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: UI.light.text,
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    color: UI.light.muted,
    textAlign: "center",
  },
  roleBadge: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: UI.light.text,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    gap: 10,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  planLabel: {
    fontSize: 13,
    color: UI.light.muted,
  },
  planValue: {
    fontSize: 15,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
  planSub: {
    fontSize: 12,
    color: UI.light.muted,
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: UI.light.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: UI.light.muted,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    color: UI.light.primaryDark,
  },
  metricNote: {
    marginTop: 4,
    fontSize: 12,
    color: UI.light.muted,
  },
  metricSkeleton: {
    flex: 1,
    height: 90,
    borderRadius: 18,
  },
  adminActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  adminActionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(36,50,74,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  adminActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
  storeList: {
    marginTop: 12,
    gap: 10,
  },
  storeCard: {
    backgroundColor: UI.light.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: UI.light.text,
  },
  storeMeta: {
    fontSize: 12,
    color: UI.light.muted,
  },
  storeDetail: {
    marginTop: 4,
    fontSize: 12,
    color: UI.light.muted,
  },
  checkinColumn: {
    marginTop: 14,
    gap: 8,
  },
  checkinRow: {
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    padding: 12,
  },
  checkinTime: {
    fontSize: 11,
    color: UI.light.muted,
  },
  checkinNote: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: UI.light.text,
  },
  card: {
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 15,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: UI.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: UI.light.muted,
  },
  infoValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: UI.light.text,
  },
  actionCard: {
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: UI.light.text,
  },
  inputRow: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: UI.light.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: UI.light.text,
    paddingVertical: 13,
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: UI.light.success,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoutButton: {
    marginTop: 18,
    marginHorizontal: 16,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: UI.light.danger,
    borderWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
