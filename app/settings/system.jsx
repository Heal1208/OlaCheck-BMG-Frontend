import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TabHero from "../../components/TabHero";

const THEMES = ["Sáng", "Tối", "Tự động"];
const SYNC_TIMES = ["5 phút", "15 phút", "30 phút"];

export default function SystemConfigScreen() {
  // ─── STATE ──────────────────────────────────────────────────────────
  const [theme, setTheme] = useState("Tự động");
  const [syncTime, setSyncTime] = useState("15 phút");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cacheSize, setCacheSize] = useState("45MB");

  // Modals
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // ─── EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("setting_theme");
        const storedSync = await AsyncStorage.getItem("setting_sync");
        const storedPush = await AsyncStorage.getItem("setting_push");
        const storedSound = await AsyncStorage.getItem("setting_sound");
        const storedCache = await AsyncStorage.getItem("setting_cacheSize");

        if (storedTheme) setTheme(storedTheme);
        if (storedSync) setSyncTime(storedSync);
        if (storedPush !== null) setPushEnabled(storedPush === "true");
        if (storedSound !== null) setSoundEnabled(storedSound === "true");
        if (storedCache) setCacheSize(storedCache);
      } catch (e) {
        console.error("Failed to load settings");
      }
    };
    loadSettings();
  }, []);

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.error("Failed to save setting", key);
    }
  };

  const handleTogglePush = (val) => {
    setPushEnabled(val);
    saveSetting("setting_push", val);
  };

  const handleToggleSound = (val) => {
    setSoundEnabled(val);
    saveSetting("setting_sound", val);
  };

  const handleClearCache = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa bộ nhớ đệm không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setCacheSize("0MB");
          saveSetting("setting_cacheSize", "0MB");
          Alert.alert("Thành công", "Đã xóa bộ nhớ đệm.");
        },
      },
    ]);
  };

  // ─── COMPONENTS ─────────────────────────────────────────────────────
  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const RowItem = ({ icon, iconBg, title, value, subtext, onRightPress, showChevron, RightComponent }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onRightPress ? 0.7 : 1}
      onPress={onRightPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtext && <Text style={styles.rowSubtext}>{subtext}</Text>}
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {RightComponent && <RightComponent />}
        {showChevron && <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
      </View>
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles.divider} />;

  // ─── RENDER ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TabHero showBack backLabel="Back" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: App Preferences */}
        <View style={styles.section}>
          <SectionHeader title="Tùy chọn ứng dụng" />
          <View style={styles.cardGroup}>
            <RowItem
              icon="color-palette"
              iconBg="#007AFF"
              title="Chế độ hiển thị"
              value={theme}
              showChevron
              onRightPress={() => setShowThemeModal(true)}
            />
            <Divider />
            <RowItem
              icon="time"
              iconBg="#FF9500"
              title="Tự động đồng bộ"
              value={syncTime}
              showChevron
              onRightPress={() => setShowSyncModal(true)}
            />
          </View>
        </View>

        {/* SECTION 2: Notifications */}
        <View style={styles.section}>
          <SectionHeader title="Thông báo cục bộ" />
          <View style={styles.cardGroup}>
            <RowItem
              icon="notifications"
              iconBg="#FF3B30"
              title="Cho phép thông báo"
              RightComponent={() => <Switch value={pushEnabled} onValueChange={handleTogglePush} />}
            />
            <Divider />
            <RowItem
              icon="volume-high"
              iconBg="#5856D6"
              title="Âm thanh khi có sự cố"
              RightComponent={() => <Switch value={soundEnabled} onValueChange={handleToggleSound} />}
            />
          </View>
        </View>

        {/* SECTION 3: Connected Devices */}
        <View style={styles.section}>
          <SectionHeader title="Thiết bị ngoại vi" />
          <View style={styles.cardGroup}>
            <RowItem
              icon="print"
              iconBg="#34C759"
              title="Máy in hóa đơn"
              subtext="Chưa kết nối"
              showChevron
              onRightPress={() => {}}
            />
            <Divider />
            <RowItem
              icon="barcode"
              iconBg="#AF52DE"
              title="Súng quét mã vạch"
              showChevron
              onRightPress={() => {}}
            />
          </View>
        </View>

        {/* SECTION 4: Data & Support */}
        <View style={styles.section}>
          <SectionHeader title="Dữ liệu & Hỗ trợ" />
          <View style={styles.cardGroup}>
            <RowItem
              icon="trash"
              iconBg="#8E8E93"
              title="Xóa bộ nhớ đệm"
              subtext={`Đã dùng ${cacheSize}`}
              onRightPress={handleClearCache}
            />
            <Divider />
            <RowItem
              icon="help-circle"
              iconBg="#007AFF"
              title="Trung tâm hỗ trợ"
              showChevron
              onRightPress={() => {}}
            />
            <Divider />
            <RowItem
              icon="headset"
              iconBg="#FF9500"
              title="Báo lỗi hệ thống"
              showChevron
              onRightPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>

      {/* ─── MODALS ─── */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn chế độ hiển thị</Text>
            {THEMES.map((t, idx) => (
              <TouchableOpacity
                key={t}
                style={[styles.modalOption, idx < THEMES.length - 1 && styles.modalOptionBorder]}
                onPress={() => {
                  setTheme(t);
                  saveSetting("setting_theme", t);
                  setShowThemeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, theme === t && styles.modalOptionSelected]}>{t}</Text>
                {theme === t && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowThemeModal(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSyncModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tần suất đồng bộ</Text>
            {SYNC_TIMES.map((time, idx) => (
              <TouchableOpacity
                key={time}
                style={[styles.modalOption, idx < SYNC_TIMES.length - 1 && styles.modalOptionBorder]}
                onPress={() => {
                  setSyncTime(time);
                  saveSetting("setting_sync", time);
                  setShowSyncModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, syncTime === time && styles.modalOptionSelected]}>{time}</Text>
                {syncTime === time && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSyncModal(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Native iOS light gray background
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 12,
  },
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  rowSubtext: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: 16,
    color: "#8E8E93",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C6C6C8",
    marginLeft: 58, // Align with text content
  },

  // ─── Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  modalOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#C6C6C8",
  },
  modalOptionText: {
    fontSize: 17,
    color: "#000000",
  },
  modalOptionSelected: {
    color: "#007AFF",
    fontWeight: "500",
  },
  modalCancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#C6C6C8",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
});
