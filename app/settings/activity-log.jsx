import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import TabHero from "../../components/TabHero";

const logEntries = [
  { title: "Director login", time: "Today · 09:12", status: "Success" },
  { title: "Store data refresh", time: "Yesterday · 18:04", status: "Completed" },
  { title: "Alert approval", time: "Apr 5 · 14:22", status: "Pending review" },
];

export default function ActivityLogScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TabHero
        showBack
        backLabel="Go back"
        onBack={() => router.back()}
      />
      <View style={styles.section}>
        {logEntries.map((entry) => (
          <View key={entry.title} style={styles.entryRow}>
            <View style={styles.entryIcon}>
              <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.entryBody}>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryTime}>{entry.time}</Text>
            </View>
            <Text style={styles.entryStatus}>{entry.status}</Text>
          </View>
        ))}
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
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  entryRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FF3B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  entryBody: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#24324A",
  },
  entryTime: {
    fontSize: 12,
    color: "#5A6272",
  },
  entryStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF3B3B",
  },
});
