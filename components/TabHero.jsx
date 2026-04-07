import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const HERO_MIN_HEIGHT = Math.max(WINDOW_HEIGHT * 0.18, 130);

export const HERO_UI = {
  primary: "#E7DA66",
  primaryDark: "#24324A",
  background: "#F6F7FB",
  textLight: "#24324A",
  textSoft: "#24324A",
};

export default function TabHero({
  eyebrow,
  title,
  right,
  children,
  compact = false,
  showBack = false,
  backLabel,
  onBack,
}) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <LinearGradient colors={["#E7DA66", "#D8B73E"]} style={[styles.hero, compact && styles.heroCompact]}>
      <View style={[styles.topRow, compact && styles.topRowCompact]}>
        <View style={styles.leftWrap}>
          {showBack ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={20} color={HERO_UI.textLight} />
              {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
            </TouchableOpacity>
          ) : (
            <View style={styles.leftSpacer} />
          )}
        </View>
        <View style={styles.titleWrap}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View style={styles.rightWrap}>{right}</View> : <View style={styles.rightSpacer} />}
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: "space-between",
    minHeight: HERO_MIN_HEIGHT,
  },
  heroCompact: {
    minHeight: HERO_MIN_HEIGHT * 0.85,
    paddingTop: 16,
  },
  topRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    width: "100%",
  },
  topRowCompact: {
    minHeight: 30,
  },
  leftWrap: {
    justifyContent: "center",
  },
  leftSpacer: {
    width: 0,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: HERO_UI.textLight,
  },
  titleWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 10,
    color: HERO_UI.textSoft,
    marginBottom: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: HERO_UI.textLight,
  },
  rightWrap: {
    flex: 1,
    minWidth: 42,
    minHeight: 34,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rightSpacer: {
    flex: 1,
    width: 42,
    height: 34,
  },
  content: {
    marginTop: 6,
    width: "100%",
  },
});
