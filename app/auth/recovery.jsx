import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const GOLD = "#C8960C";

export default function RecoveryScreen() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Recovery Link Sent",
                `A recovery link has been sent to ${email}. Please check your inbox.`,
                [{ text: "OK", onPress: () => router.back() }]
            );
        }, 1500);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={18} color="#555" />
                    <Text style={styles.backText}>Return to Sign In</Text>
                </TouchableOpacity>

                <View style={styles.brandRow}>
                    <View style={styles.logoBox}>
                        <Ionicons name="shield-checkmark" size={24} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.brandName}>OlaCheck-BMG</Text>
                        <Text style={styles.brandSub}>Smart Retail Management</Text>
                    </View>
                </View>

                <Text style={styles.title}>Account Recovery</Text>
                <Text style={styles.subtitle}>
                    Please enter your registered email address. We will send you a secure authentication link to regain access to your account.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TouchableOpacity style={[styles.sendBtn, loading && { opacity: 0.7 }]} onPress={handleSend} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="mail-outline" size={18} color="#fff" />
                            <Text style={styles.sendText}>Send Recovery Link</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.processCard}>
                    <Text style={styles.processTitle}>Recovery Process</Text>
                    {[
                        "Verify your email inbox for the recovery message",
                        "Click the secure authentication link provided",
                        "Access will be granted automatically upon verification",
                    ].map((step, i) => (
                        <Text key={i} style={styles.processStep}>{i + 1}. {step}</Text>
                    ))}
                </View>

                <Text style={styles.footerText}>
                    For security assistance, contact your system administrator
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    scroll: { padding: 24, paddingBottom: 40 },
    backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 28 },
    backText: { fontSize: 14, color: "#555" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 32 },
    logoBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", justifyContent: "center" },
    brandName: { fontSize: 17, fontWeight: "700", color: "#111" },
    brandSub: { fontSize: 12, color: "#888", marginTop: 2 },
    title: { fontSize: 28, fontWeight: "800", color: "#111", marginBottom: 10 },
    subtitle: { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 28 },
    input: { backgroundColor: "#f4f4f4", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, color: "#111", marginBottom: 16 },
    sendBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 24 },
    sendText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    processCard: { backgroundColor: "#FFF8E8", borderRadius: 14, padding: 20, marginBottom: 24 },
    processTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 12 },
    processStep: { fontSize: 14, color: "#444", lineHeight: 22, marginBottom: 4 },
    footerText: { fontSize: 12, color: "#aaa", textAlign: "center" },
});