import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { login, saveSession } from "../../src/services/authService";

const GOLD = "#C8960C";

const showAlert = (title, message) => {
    if (Platform.OS === "web") {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [keepSignedIn, setKeep] = useState(false);
    const [loading, setLoading] = useState(false);

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
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.logoWrap}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoLetter}>O</Text>
                    </View>
                    <Text style={styles.appName}>OlaCheck-BMG</Text>
                    <Text style={styles.appSub}>Smart Retail Management</Text>
                </View>

                <Text style={styles.title}>Sign In</Text>
                <Text style={styles.subtitle}>Access your retail management dashboard</Text>

                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputWrap}>
                    <TextInput
                        style={[styles.input, { paddingRight: 48 }]}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPw}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
                        <Ionicons name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color="#aaa" />
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <TouchableOpacity style={styles.checkRow} onPress={() => setKeep(!keepSignedIn)}>
                        <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>
                            {keepSignedIn && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <Text style={styles.checkLabel}>Keep me signed in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/auth/recovery")}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.signInBtn, loading && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.signInText}>Sign In to Dashboard</Text>
                    }
                </TouchableOpacity>

                <Text style={styles.secureText}>
                    Protected by enterprise-grade security. Your data is encrypted and secure.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    scroll: { padding: 24, paddingBottom: 40 },
    logoWrap: { alignItems: "center", marginTop: 32, marginBottom: 32 },
    logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    logoLetter: { fontSize: 32, fontWeight: "700", color: "#fff" },
    appName: { fontSize: 20, fontWeight: "700", color: "#111" },
    appSub: { fontSize: 13, color: "#888", marginTop: 2 },
    title: { fontSize: 28, fontWeight: "800", color: "#111", marginBottom: 6 },
    subtitle: { fontSize: 14, color: "#888", marginBottom: 24 },
    inputWrap: { position: "relative", marginBottom: 14 },
    input: { backgroundColor: "#f4f4f4", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, color: "#111" },
    eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: "#ccc", borderRadius: 4, alignItems: "center", justifyContent: "center" },
    checkboxActive: { backgroundColor: GOLD, borderColor: GOLD },
    checkLabel: { fontSize: 13, color: "#444" },
    forgotText: { fontSize: 13, color: GOLD, fontWeight: "600" },
    signInBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 18, alignItems: "center", marginBottom: 28 },
    signInText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    secureText: { fontSize: 12, color: "#aaa", textAlign: "center", lineHeight: 18 },
});