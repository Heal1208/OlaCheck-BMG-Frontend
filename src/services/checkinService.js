import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config/api";

const authHeader = async () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

export const createCheckin = async (data) => {
    const res = await fetch(`${API_BASE_URL}/checkins`, {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const getCheckins = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/checkins?${query}`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const getCheckin = async (checkId) => {
    const res = await fetch(`${API_BASE_URL}/checkins/${checkId}`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const completeCheckin = async (checkId) => {
    const res = await fetch(`${API_BASE_URL}/checkins/${checkId}/complete`, {
        method: "PUT",
        headers: await authHeader(),
    });
    return res.json();
};

export const createStockEntries = async (checkId, entries) => {
    const res = await fetch(`${API_BASE_URL}/checkins/${checkId}/stock-entries`, {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ entries }),
    });
    return res.json();
};

export const getStockEntries = async (checkId) => {
    const res = await fetch(`${API_BASE_URL}/checkins/${checkId}/stock-entries`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const createExpiryRecord = async (entryId, data) => {
    const res = await fetch(`${API_BASE_URL}/stock-entries/${entryId}/expiry-records`, {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const getExpiryRecords = async (entryId) => {
    const res = await fetch(`${API_BASE_URL}/stock-entries/${entryId}/expiry-records`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const getProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/products`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const getAlerts = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/alerts?${query}`, {
        headers: await authHeader(),
    });
    return res.json();
};

export const resolveAlert = async (alertId) => {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
        method: "PUT",
        headers: await authHeader(),
    });
    return res.json();
};