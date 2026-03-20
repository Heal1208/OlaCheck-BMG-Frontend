import { useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, Platform, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createCheckin } from "../../src/services/checkinService";

const PURPLE = "#5B4FD9";

const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
        const msg = `${title}\n\n${message}`;
        if (buttons && buttons.length > 1) {
            const confirmed = window.confirm(msg);
            if (confirmed) {
                const btn = buttons.find(b => b.style === "destructive" || b.text === "OK");
                btn?.onPress?.();
            }
        } else {
            window.alert(msg);
            buttons?.[0]?.onPress?.();
        }
    } else {
        Alert.alert(title, message, buttons);
    }
};

export default function CheckinScreen() {
    const { store } = useLocalSearchParams();
    const storeData = store ? JSON.parse(store) : null;

    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [gpsLat, setGpsLat] = useState("");
    const [gpsLng, setGpsLng] = useState("");
    const [locating, setLocating] = useState(false);

    const getLocation = () => {
        setLocating(true);
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGpsLat(String(pos.coords.latitude));
                    setGpsLng(String(pos.coords.longitude));
                    setLocating(false);
                },
                () => {
                    showAlert("Error", "Could not get location. Please enter coordinates manually.");
                    setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            showAlert("Error", "Geolocation is not supported. Please enter coordinates manually.");
            setLocating(false);
        }
    };

    const handleCheckin = async () => {
        if (!gpsLat || !gpsLng) {
            showAlert("Error", "Please get your GPS location first."); return;
        }
        setLoading(true);
        try {
            const result = await createCheckin({
                store_id: storeData.store_id,
                gps_lat: parseFloat(gpsLat),
                gps_lng: parseFloat(gpsLng),
                note: note || null,
            });
            if (result.success) {
                showAlert(
                    result.data.gps_verified ? "Check-in Successful ✓" : "Check-in Recorded ⚠",
                    result.data.gps_verified
                        ? `You have checked in at ${storeData.store_name}.`
                        : `Checked in but GPS location does not match store location.`,
                    [{
                        text: "Start Stock Entry",
                        onPress: () => router.replace({
                            pathname: "/checkins/stock-entry",
                            params: {
                                check_id: result.data.check_id,
                                store_name: storeData.store_name,
                            }
                        })
                    }]
                );
            } else {
                showAlert("Failed", result.message);
            }
        } catch {
            showAlert("Error", "Cannot connect to server.");
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Store Check-in</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.storeCard}>
                    <View style={styles.storeIcon}>
                        <Ionicons name="storefront-outline" size={28} color={PURPLE} />
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{storeData?.store_name}</Text>
                        <Text style={styles.storeAddr}>
                            {storeData?.address}, {storeData?.district}, {storeData?.city}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>GPS LOCATION</Text>
                <View style={styles.gpsCard}>
                    <TouchableOpacity
                        style={[styles.gpsBtn, locating && { opacity: 0.7 }]}
                        onPress={getLocation}
                        disabled={locating}
                    >
                        {locating
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="navigate-outline" size={20} color="#fff" />
                                <Text style={styles.gpsBtnText}>Get My Location</Text>
                            </>
                        }
                    </TouchableOpacity>

                    {gpsLat && gpsLng ? (
                        <View style={styles.coordBox}>
                            <Ionicons name="checkmark-circle" size={18} color="#27AE60" />
                            <Text style={styles.coordText}>
                                {parseFloat(gpsLat).toFixed(6)}, {parseFloat(gpsLng).toFixed(6)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.gpsHint}>Or enter coordinates manually below</Text>
                    )}

                    <View style={styles.manualRow}>
                        <TextInput
                            style={[styles.coordInput, { flex: 1 }]}
                            placeholder="Latitude"
                            placeholderTextColor="#aaa"
                            value={gpsLat}
                            onChangeText={setGpsLat}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            style={[styles.coordInput, { flex: 1 }]}
                            placeholder="Longitude"
                            placeholderTextColor="#aaa"
                            value={gpsLng}
                            onChangeText={setGpsLng}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>

                <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note about this visit..."
                    placeholderTextColor="#aaa"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity
                    style={[styles.checkinBtn, loading && { opacity: 0.7 }]}
                    onPress={handleCheckin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="location-outline" size={20} color="#fff" />
                            <Text style={styles.checkinBtnText}>Check In Now</Text>
                        </>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f8f8" },
    header: { backgroundColor: PURPLE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    scroll: { padding: 20, paddingBottom: 40 },
    storeCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
    storeIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#F0F0FF", alignItems: "center", justifyContent: "center" },
    storeInfo: { flex: 1 },
    storeName: { fontSize: 16, fontWeight: "700", color: "#111" },
    storeAddr: { fontSize: 12, color: "#888", marginTop: 3 },
    sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1, marginBottom: 10 },
    gpsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, gap: 12 },
    gpsBtn: { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    gpsBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    coordBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8F5E9", borderRadius: 10, padding: 10 },
    coordText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
    gpsHint: { fontSize: 12, color: "#aaa", textAlign: "center" },
    manualRow: { flexDirection: "row", gap: 10 },
    coordInput: { backgroundColor: "#f4f4f4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: "#111" },
    noteInput: { backgroundColor: "#fff", borderRadius: 14, padding: 16, fontSize: 14, color: "#111", minHeight: 90, textAlignVertical: "top", marginBottom: 24 },
    checkinBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    checkinBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});