import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TabHero from "../../components/TabHero";

export default function SystemConfigScreen() {
  const toggles = [
    { label: "Global Alert Thresholds", value: "Stock / Expiry" },
    { label: "Notification Routing", value: "Operations & Directors" },
    { label: "API Integrations", value: "Enabled" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TabHero showBack backLabel="Back" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Controls</Text>
        {toggles.map((item) => (
          <View key={item.label} style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>{item.label}</Text>
              <Text style={styles.controlValue}>{item.value}</Text>
            </View>
            <TouchableOpacity style={styles.btn}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action Center</Text>
        <TouchableOpacity style={styles.dialogButton}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
          <Text style={styles.dialogLabel}>Review Access Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dialogButton}>
          <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
          <Text style={styles.dialogLabel}>Adjust Alert Workflows</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  content: {
    paddingBottom: 132,
  },
  section: {
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#24324A",
  },
  controlRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#24324A",
  },
  controlValue: {
    marginTop: 4,
    fontSize: 12,
    color: "#5A6272",
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#24324A",
    alignItems: "center",
    justifyContent: "center",
  },
  dialogButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#24324A",
    borderRadius: 16,
    padding: 14,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
