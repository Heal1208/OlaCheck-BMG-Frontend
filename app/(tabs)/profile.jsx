import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUser, changePassword, logout, clearSession } from "../../src/services/authService";

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
  green: "#4CAF89",
  greenBg: "#E8F8F2",
  red: "#E53935",
  redBg: "#FFEBEE",
};

const showAlert = (title, message, buttons) => {
  if (Platform.OS === "web") {
    const msg = `${title}\n\n${message}`;
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(msg);
      if (confirmed) {
        const confirmBtn = buttons.find(b => b.style === "destructive" || b.text === "OK");
        confirmBtn?.onPress?.();
      }
    } else {
      window.alert(msg);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// ─── Divider ──────────────────────────────────────────────────────────────────
const HDivider = ({ style }) => <View style={[styles.hDivider, style]} />;

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, isLast }) => (
  <>
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={C.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
    {!isLast && <HDivider style={{ marginHorizontal: 16 }} />}
  </>
);

// ─── Password Input ───────────────────────────────────────────────────────────
const PwInput = ({ placeholder, value, onChangeText, show, onToggle, secureFixed }) => (
  <View style={styles.pwRow}>
    <Ionicons name="lock-closed-outline" size={16} color={C.muted} style={{ marginRight: 4 }} />
    <TextInput
      style={styles.pwInput}
      placeholder={placeholder}
      placeholderTextColor="#BBBBBB"
      secureTextEntry={secureFixed ? true : !show}
      value={value}
      onChangeText={onChangeText}
    />
    {!secureFixed && onToggle && (
      <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
        <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={17} color={C.muted} />
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

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
          onPress: () => {
            setShowForm(false);
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
          }
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

  if (!user)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.gold} />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerLabel}>Profile</Text>
          <TouchableOpacity style={styles.headerSettingsBtn}>
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.88)" />
          </TouchableOpacity>
        </View>

        {/* Role divider */}
        <View style={styles.roleDividerRow}>
          <View style={styles.headerDivider} />
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{user.role?.replace(/_/g, " ")}</Text>
          </View>
          <View style={styles.headerDivider} />
        </View>
      </View>

      {/* ── AVATAR CARD (overlap) ── */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.full_name?.[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.avatarName}>{user.full_name}</Text>
          <Text style={styles.avatarEmail}>{user.email}</Text>
        </View>
      </View>

      {/* ── BODY ── */}
      <View style={styles.body}>

        {/* Account Info */}
        <SectionHeader title="Account Info" />
        <Text style={styles.sectionSub}>Your personal account details.</Text>

        <View style={styles.cardContainer}>
          {[
            { icon: "person-outline", label: "Full Name", value: user.full_name },
            { icon: "mail-outline", label: "Email", value: user.email },
            { icon: "shield-checkmark-outline", label: "Role", value: user.role?.replace(/_/g, " ") },
          ].map((item, i, arr) => (
            <InfoRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              isLast={i === arr.length - 1}
            />
          ))}
        </View>

        {/* Security */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Security" />
          <Text style={styles.sectionSub}>Manage your password and access.</Text>

          <View style={styles.cardContainer}>
            {/* Toggle row */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setShowForm(!showForm)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: C.greenBg }]}>
                <Ionicons name="lock-closed-outline" size={18} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Change Password</Text>
                <Text style={styles.actionSub}>Update your login credentials</Text>
              </View>
              <Ionicons
                name={showForm ? "chevron-up" : "chevron-down"}
                size={16} color="#CCCCCC"
              />
            </TouchableOpacity>

            {/* Password form */}
            {showForm && (
              <>
                <HDivider />
                <View style={styles.pwForm}>
                  <PwInput
                    placeholder="Current Password"
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    show={showCur}
                    onToggle={() => setShowCur(!showCur)}
                  />
                  <HDivider style={{ marginHorizontal: 0 }} />
                  <PwInput
                    placeholder="New Password (min 8 chars)"
                    value={newPw}
                    onChangeText={setNewPw}
                    show={showNew}
                    onToggle={() => setShowNew(!showNew)}
                  />
                  <HDivider style={{ marginHorizontal: 0 }} />
                  <PwInput
                    placeholder="Confirm New Password"
                    value={confirmPw}
                    onChangeText={setConfirmPw}
                    secureFixed
                  />
                  <HDivider />
                  <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color={C.white} size="small" />
                      : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                          <Ionicons name="checkmark-circle-outline" size={16} color={C.white} />
                          <Text style={styles.saveBtnText}>Update Password</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: 28 }}>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: C.redBg }]}>
                <Ionicons name="log-out-outline" size={18} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, { color: C.red }]}>Sign Out</Text>
                <Text style={styles.actionSub}>You will be logged out of this device</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#D0D0D0" />
            </TouchableOpacity>
          </View>
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
    paddingBottom: 48,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  headerSettingsBtn: {
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
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  rolePill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  rolePillText: {
    fontSize: 11,
    color: C.white,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // Avatar card (overlap)
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -28,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.goldBg,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
  },
  avatarName: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  avatarEmail: {
    fontSize: 12,
    color: C.muted,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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

  // Divider
  hDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 13,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.goldBg,
    borderWidth: 1,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  // Action row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 13,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    color: C.muted,
  },

  // Password form
  pwForm: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 0,
  },
  pwRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 8,
  },
  pwInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },

  // Save button
  saveBtn: {
    backgroundColor: C.gold,
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Logout row
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 13,
  },
});