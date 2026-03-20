import { useEffect, useState } from "react";
import { Stack, router, SplashScreen } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [ready, setReady]           = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("token").then((token) => {
            setIsLoggedIn(!!token);
            setReady(true);
            SplashScreen.hideAsync();
        });
    }, []);

    useEffect(() => {
        if (!ready) return;
        if (!isLoggedIn) router.replace("/auth/login");
    }, [ready, isLoggedIn]);

    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#5B4FD9" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/recovery" />
            <Stack.Screen name="stores/search" />
            <Stack.Screen name="stores/create" />
            <Stack.Screen name="stores/edit" />
            <Stack.Screen name="staff/create" />
            <Stack.Screen name="checkins/checkin" />
            <Stack.Screen name="checkins/stock-entry" />
            <Stack.Screen name="checkins/expiry" />
        </Stack>
    );
}