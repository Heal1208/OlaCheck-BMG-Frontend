import { useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, Platform,
} from "react-native";

const GOLD = "#C8960C";

// ─── Hook dùng trong các screen ───────────────────────────────
export function useAlert() {
    const [alertConfig, setAlertConfig] = useState(null);

    const showAlert = (title, message, buttons) => {
        setAlertConfig({
            title,
            message,
            buttons: buttons || [{ text: "OK" }],
        });
    };

    const hideAlert = () => setAlertConfig(null);

    return { alertConfig, showAlert, hideAlert };
}

// ─── Component hiển thị ───────────────────────────────────────
export default function AlertBox({ config, onHide }) {
    if (!config) return null;

    const handlePress = (btn) => {
        onHide();
        btn?.onPress?.();
    };

    return (
        <Modal
            transparent
            visible={!!config}
            animationType="fade"
            onRequestClose={onHide}
        >
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <View style={styles.iconRow}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>!</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{config.title}</Text>

                    {config.message ? (
                        <Text style={styles.message}>{config.message}</Text>
                    ) : null}

                    <View style={[
                        styles.btnRow,
                        config.buttons.length === 1 && styles.btnRowSingle
                    ]}>
                        {config.buttons.map((btn, i) => {
                            const isDestructive = btn.style === "destructive";
                            const isCancel = btn.style === "cancel";
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.btn,
                                        config.buttons.length === 1 && styles.btnFull,
                                        isDestructive && styles.btnDestructive,
                                        isCancel && styles.btnCancel,
                                        !isDestructive && !isCancel && styles.btnPrimary,
                                    ]}
                                    onPress={() => handlePress(btn)}
                                >
                                    <Text style={[
                                        styles.btnText,
                                        isDestructive && styles.btnTextDestructive,
                                        isCancel && styles.btnTextCancel,
                                        !isDestructive && !isCancel && styles.btnTextPrimary,
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 32 },
    box: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
    iconRow: { marginBottom: 14 },
    iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFF8E8", borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center" },
    iconText: { fontSize: 24, fontWeight: "800", color: GOLD },
    title: { fontSize: 17, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
    message: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21, marginBottom: 22 },
    btnRow: { flexDirection: "row", gap: 10, width: "100%" },
    btnRowSingle: { justifyContent: "center" },
    btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
    btnFull: { flex: 1 },
    btnPrimary: { backgroundColor: GOLD },
    btnDestructive: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
    btnCancel: { backgroundColor: "#f4f4f4", borderWidth: 1, borderColor: "#e0e0e0" },
    btnText: { fontSize: 14, fontWeight: "700" },
    btnTextPrimary: { color: "#fff" },
    btnTextDestructive: { color: "#E53935" },
    btnTextCancel: { color: "#555" },
});