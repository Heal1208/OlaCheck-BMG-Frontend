import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import API_BASE_URL from "../config/api";

const authHeader = async () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

// ─── A-11: Staff Schedule ────────────────────────────────────
export const getStaffSchedule = async (date = "") => {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`${API_BASE_URL}/stats/staff-schedule${q}`, {
    headers: await authHeader(),
  });
  return res.json();
};

// ─── A-12: Inventory Statistics ─────────────────────────────
export const getInventoryStats = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/stats/inventory?${q}`, {
    headers: await authHeader(),
  });
  return res.json();
};

// ─── A-15: Export XLSX ───────────────────────────────────────
// Web  → fetch blob → <a download> click
// Mobile → expo-file-system download → expo-sharing
export const exportInventoryReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const q = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/stats/export?${q}`;

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `BMG_inventory_${ts}.xlsx`;
    const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // ══════════════════════════════════════════════
    // WEB BROWSER
    // ══════════════════════════════════════════════
    if (Platform.OS === "web") {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let message = "Tải file thất bại. Vui lòng thử lại.";
        try {
          const err = await res.json();
          if (err.message) message = err.message;
        } catch { /* ignore */ }
        return { success: false, message };
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

      return { success: true, message: "Xuất báo cáo thành công." };
    }

    // ══════════════════════════════════════════════
    // MOBILE (iOS / Android)
    // ══════════════════════════════════════════════
    const FileSystem = (await import("expo-file-system")).default;
    const Sharing = await import("expo-sharing");

    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    const result = await FileSystem.downloadAsync(url, fileUri, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status !== 200) {
      return { success: false, message: "Tải file thất bại. Vui lòng thử lại." };
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, message: "Thiết bị không hỗ trợ chia sẻ file." };
    }

    await Sharing.shareAsync(result.uri, {
      mimeType,
      dialogTitle: "Lưu báo cáo tồn kho Excel",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });

    return { success: true, message: "Xuất báo cáo thành công." };

  } catch (error) {
    console.error("Export error:", error);
    return { success: false, message: "Không thể xuất báo cáo. Vui lòng thử lại." };
  }
};

// ─── A-03: Password Recovery ─────────────────────────────────
export const sendRecoveryRequest = async (email) => {
  const res = await fetch(`${API_BASE_URL}/recovery/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const getRecoveryRequests = async () => {
  const res = await fetch(`${API_BASE_URL}/recovery/requests`, {
    headers: await authHeader(),
  });
  return res.json();
};

export const resolveRecovery = async (requestId) => {
  const res = await fetch(`${API_BASE_URL}/recovery/requests/${requestId}/resolve`, {
    method: "PUT",
    headers: await authHeader(),
  });
  return res.json();
};