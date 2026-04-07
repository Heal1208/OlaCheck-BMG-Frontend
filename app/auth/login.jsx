import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import { login, saveSession } from "../../src/services/authService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#24324A",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#5A6272",
  border: "#E9EDF5",
  success: "#1A8A5D",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keepSignedIn, setKeep] = useState(false);
  const [loading, setLoading] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Error", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        await saveSession(result.data.token, result.data.user);
        router.replace("/(tabs)");
      } else {
        showAlert("Sign In Failed", result.message);
      }
    } catch {
      showAlert("Connection Error", "Cannot connect to server. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={["#E7DA66", "#D8B73E"]} style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/olasun-leaf.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>OlaCheck-BMG</Text>
          <Text style={styles.heroSub}>Smart retail operations, unified in one place.</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Access your dashboard and manage daily operations.</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={UI.muted} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#A9B3C3"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={UI.muted} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A9B3C3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPw((value) => !value)}>
              <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={18} color={UI.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.checkRow} onPress={() => setKeep((value) => !value)}>
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>
                {keepSignedIn && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkLabel}>Keep me signed in</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/recovery")}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.noteCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={UI.primaryDark} />
            <Text style={styles.noteText}>
              Protected by enterprise-grade security. Your data stays encrypted in transit.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 18,
    paddingTop: 28,
    paddingBottom: 28,
  },
  hero: {
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: UI.text,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: UI.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: UI.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: UI.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 19,
    color: UI.muted,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: UI.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: UI.text,
    paddingVertical: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#C9D2E3",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: UI.primaryDark,
    borderColor: UI.primaryDark,
  },
  checkLabel: {
    fontSize: 13,
    color: UI.muted,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.primaryDark,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: UI.success,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  noteCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: UI.primarySoft,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: UI.text,
  },
});
