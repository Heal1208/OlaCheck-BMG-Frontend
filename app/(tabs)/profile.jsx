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
import TabHero from "../../components/TabHero";
import { changePassword, clearSession, getUser, logout } from "../../src/services/authService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  border: "#E9EDF5",
  success: "#29B36A",
  danger: "#FF5B5B",
};

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

  useEffect(() => {
    getUser().then(setUser);
  }, []);

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

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={UI.primary} />
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
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.card}>
          {[
            { icon: "person-outline", label: "Full Name", value: user.full_name },
            { icon: "mail-outline", label: "Email", value: user.email },
            { icon: "shield-checkmark-outline", label: "Role", value: user.role?.replace("_", " ") },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={UI.primaryDark} />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.actionCard} onPress={() => setShowForm((value) => !value)}>
          <View style={styles.actionLeft}>
            <View style={styles.infoIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={UI.primaryDark} />
            </View>
            <Text style={styles.actionLabel}>Change Password</Text>
          </View>
          <Ionicons
            name={showForm ? "chevron-up-outline" : "chevron-down-outline"}
            size={18}
            color={UI.muted}
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
              />
              <TouchableOpacity onPress={() => setShowCur((value) => !value)}>
                <Ionicons name={showCur ? "eye-outline" : "eye-off-outline"} size={18} color={UI.muted} />
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
              />
              <TouchableOpacity onPress={() => setShowNew((value) => !value)}>
                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={18} color={UI.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#A9B3C3"
                secureTextEntry
                value={confirmPw}
                onChangeText={setConfirmPw}
              />
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
        <Ionicons name="log-out-outline" size={18} color={UI.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  content: {
    paddingBottom: 118,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.background,
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
    color: UI.primaryDark,
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: "#5B5214",
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    color: "#FFFCE7",
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
    color: UI.primaryDark,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: UI.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: UI.card,
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
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: UI.muted,
  },
  infoValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: UI.text,
  },
  actionCard: {
    backgroundColor: UI.card,
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
    color: UI.text,
  },
  inputRow: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: UI.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: UI.text,
    paddingVertical: 13,
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: UI.primaryDark,
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
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#FFD8D8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: UI.danger,
  },
});
