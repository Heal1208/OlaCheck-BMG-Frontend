import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUser, changePassword, logout, clearSession } from "../../src/services/authService";
import AlertBox, { useAlert } from "../../components/AlertBox";

const GOLD = "#C8960C";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useEffect(() => { getUser().then(setUser); }, []);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showAlert("Error", "Please fill in all fields."); return;
    }
    if (newPw !== confirmPw) {
      showAlert("Error", "New passwords do not match."); return;
    }
    if (newPw.length < 8) {
      showAlert("Error", "New password must be at least 8 characters."); return;
    }
    setLoading(true);
    try {
      const r = await changePassword(currentPw, newPw);
      if (r.success) {
        showAlert("Success", "Password changed successfully.", [{
          text: "OK",
          onPress: () => { setShowForm(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
        }]);
      } else {
        showAlert("Failed", r.message);
      }
    } catch {
      showAlert("Error", "Cannot connect to server.");
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    showAlert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try { await logout(); } catch { }
          await clearSession();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  if (!user) return <View style={styles.center}><ActivityIndicator color={GOLD} /></View>;

  return (
    <ScrollView style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />
      <View style={styles.headerBg}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.full_name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user.full_name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role?.replace("_", " ")}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>
        <View style={styles.card}>
          {[
            { icon: "person-outline", label: "Full Name", value: user.full_name },
            { icon: "mail-outline", label: "Email", value: user.email },
            { icon: "shield-outline", label: "Role", value: user.role?.replace("_", " ") },
          ].map((item, i) => (
            <View key={item.label} style={[styles.infoRow, i > 0 && styles.borderTop]}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={16} color={GOLD} />
              </View>
              <View>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY</Text>
        <TouchableOpacity style={[styles.card, styles.actionRow]} onPress={() => setShowForm(!showForm)}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#27AE60" />
            </View>
            <Text style={styles.actionLabel}>Change Password</Text>
          </View>
          <Ionicons name={showForm ? "chevron-up" : "chevron-down"} size={18} color="#aaa" />
        </TouchableOpacity>
        {showForm && (
          <View style={[styles.card, { marginTop: 10, gap: 12 }]}>
            <View style={styles.pwRow}>
              <TextInput style={styles.pwInput} placeholder="Current Password" placeholderTextColor="#aaa" secureTextEntry={!showCur} value={currentPw} onChangeText={setCurrentPw} />
              <TouchableOpacity onPress={() => setShowCur(!showCur)}>
                <Ionicons name={showCur ? "eye-outline" : "eye-off-outline"} size={18} color="#aaa" />
              </TouchableOpacity>
            </View>
            <View style={styles.pwRow}>
              <TextInput style={styles.pwInput} placeholder="New Password (min 8)" placeholderTextColor="#aaa" secureTextEntry={!showNew} value={newPw} onChangeText={setNewPw} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={18} color="#aaa" />
              </TouchableOpacity>
            </View>
            <View style={styles.pwRow}>
              <TextInput style={styles.pwInput} placeholder="Confirm New Password" placeholderTextColor="#aaa" secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
            </View>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E53935" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBg: { backgroundColor: GOLD, paddingTop: 52, paddingBottom: 64, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  avatarWrap: { alignItems: "center", marginTop: -40, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#fff" },
  avatarLetter: { fontSize: 36, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#111", marginTop: 10 },
  roleBadge: { marginTop: 6, backgroundColor: "#FFF8E8", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleText: { fontSize: 13, color: GOLD, fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", padding: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  borderTop: { borderTopWidth: 1, borderTopColor: "#f5f5f5" },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFF8E8", alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, color: "#888" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111", marginTop: 1 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  pwRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f4f4f4", borderRadius: 10, paddingHorizontal: 14 },
  pwInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: "#111" },
  saveBtn: { backgroundColor: GOLD, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#FFEBEE" },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#E53935" },
});