import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config/api";

const authHeader = async () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

export const getStaffList = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/admin/staff?${query}`, { headers: await authHeader() });
    return res.json();
};

export const createStaff = async (data) => {
    const res = await fetch(`${API_BASE_URL}/admin/staff`, {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateStaff = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/admin/staff/${id}`, {
        method: "PUT",
        headers: await authHeader(),
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteStaff = async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/staff/${id}`, {
        method: "DELETE",
        headers: await authHeader(),
    });
    return res.json();
};

export const getRoles = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/roles`, { headers: await authHeader() });
    return res.json();
};