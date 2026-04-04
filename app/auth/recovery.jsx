import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  border: "#E9EDF5",
};

export default function RecoveryScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const handleSend = () => {
    if (!email.trim()) {
      showAlert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showAlert(
        "Recovery Link Sent",
        `A recovery link has been sent to ${email}. Please check your inbox.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={UI.text} />
          <Text style={styles.backText}>Return to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/olasun-leaf.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>Account Recovery</Text>
          <Text style={styles.heroSub}>We will send a secure access link to your registered email.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Reset Access</Text>
          <Text style={styles.subtitle}>
            Enter the email linked to your account and follow the instructions from the recovery email.
          </Text>

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
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Send Recovery Link</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Recovery Process</Text>
            {[
              "Open the recovery email in your inbox.",
              "Tap the secure verification link.",
              "Return to the app and continue signing in.",
            ].map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
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
    paddingTop: 20,
    paddingBottom: 28,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: UI.text,
  },
  hero: {
    backgroundColor: UI.primary,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
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
    color: "#5B5214",
    textAlign: "center",
  },
  heroSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#FFFCE7",
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
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: UI.text,
    paddingVertical: 13,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: UI.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
    borderRadius: 18,
    backgroundColor: UI.primarySoft,
    padding: 14,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: UI.text,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: UI.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: UI.text,
  },
});
