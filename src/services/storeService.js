import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config/api";

const authHeader = async () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

export const getAssignedStores = async () => {
    const res = await fetch(`${API_BASE_URL}/stores/assigned`, { headers: await authHeader() });
    return res.json();
};

export const searchStores = async (params) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/stores/search?${query}`, { headers: await authHeader() });
    return res.json();
};

export const createStore = async (data) => {
    const res = await fetch(`${API_BASE_URL}/admin/stores`, {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateStore = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
        method: "PUT",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteStore = async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/stores/${id}`, {
        method: "DELETE",
        headers: await authHeader(),
    });
    return res.json();
};