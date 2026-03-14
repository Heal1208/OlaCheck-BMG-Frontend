import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config/api";

const authHeader = async () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
});

export const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
};

export const logout = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: await authHeader(),
    });
    return res.json();
};

export const changePassword = async (current_password, new_password) => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: await authHeader(),
        body: JSON.stringify({ current_password, new_password }),
    });
    return res.json();
};

export const saveSession = async (token, user) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
};

export const getUser = async () => {
    const u = await AsyncStorage.getItem("user");
    return u ? JSON.parse(u) : null;
};