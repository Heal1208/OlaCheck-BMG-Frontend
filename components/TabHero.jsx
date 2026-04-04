import { StyleSheet, Text, View } from "react-native";

export const HERO_UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  background: "#F6F7FB",
  textLight: "#5B5214",
  textSoft: "#FFFCE7",
};

export default function TabHero({ eyebrow, title, right, children, compact = false }) {
  return (
    <View style={styles.hero}>
      <View style={[styles.topRow, compact && styles.topRowCompact]}>
        <View style={styles.titleWrap}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View style={styles.rightWrap}>{right}</View> : <View style={styles.rightSpacer} />}
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
  backgroundColor: HERO_UI.primary,
  height: '40%',
  paddingTop: 28,
  paddingHorizontal: 16,
  paddingBottom: 8,
  borderBottomLeftRadius: 28,
  borderBottomRightRadius: 28,
  justifyContent: "space-between",
  },
  topRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  topRowCompact: {
    minHeight: 30,
  },
  titleWrap: {
    flex: 2,
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
