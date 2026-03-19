import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAssignedStores } from "../../src/services/storeService";
import { getUser } from "../../src/services/authService";

const C = {
  gold: "#C8860A",
  goldDark: "#A96E08",
  goldBg: "#FFF8E8",
  goldBorder: "rgba(200,134,10,0.22)",
  goldOverlay: "rgba(255,255,255,0.14)",
  goldOverlayBorder: "rgba(255,255,255,0.24)",
  goldMuted: "rgba(255,255,255,0.70)",
  bg: "#F4F4F4",
  white: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#888888",
  border: "#E8E8E8",
};

const TYPE_STYLE = {
  grocery:     { bg: "#FFF3E0", text: "#F57C00" },
  supermarket: { bg: "#E8F5E9", text: "#2E7D32" },
  agency:      { bg: "#E3F2FD", text: "#1565C0" },
};

const ADMIN_ROLES = ["Sales_Admin", "Sales_Manager", "Director", "Deputy_Director"];

// ─── Divider ──────────────────────────────────────────────────────────────────
const HDivider = ({ style }) => <View style={[styles.hDivider, style]} />;

// ─── Store Card ───────────────────────────────────────────────────────────────
const StoreCard = ({ item, isAdmin }) => {
  const tc = TYPE_STYLE[item.store_type] || { bg: "#F0F0F0", text: "#666" };
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isAdmin ? 0.8 : 1}
      onPress={() =>
        isAdmin &&
        router.push({ pathname: "/stores/edit", params: { store: JSON.stringify(item) } })
      }
    >
      {/* Icon */}
      <View style={styles.cardIconBox}>
        <Ionicons name="storefront-outline" size={20} color={C.gold} />
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Top row: name + type badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.storeName} numberOfLines={1}>{item.store_name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
            <Text style={[styles.typeBadgeText, { color: tc.text }]}>{item.store_type}</Text>
          </View>
        </View>

        {/* Owner */}
        <Text style={styles.ownerName}>{item.owner_name}</Text>

        <HDivider style={styles.cardInnerDivider} />

        {/* Meta info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={C.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.address}, {item.district}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={12} color={C.muted} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
          {isAdmin && (
            <View style={styles.tapHintRow}>
              <Ionicons name="create-outline" size={11} color={C.gold} />
              <Text style={styles.tapHint}>Edit</Text>
            </View>
          )}
        </View>
      </View>

      {isAdmin && (
        <Ionicons name="chevron-forward" size={15} color="#D0D0D0" />
      )}
    </TouchableOpacity>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StoresScreen() {
  const [stores, setStores] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { getUser().then(setCurrentUser); }, []);
  useFocusEffect(useCallback(() => { fetchStores(); }, []));

  useEffect(() => {
    if (!search.trim()) { setFiltered(stores); return; }
    const q = search.toLowerCase();
    setFiltered(stores.filter(s =>
      s.store_name.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      s.owner_name.toLowerCase().includes(q)
    ));
  }, [search, stores]);

  const fetchStores = async () => {
    try {
      const r = await getAssignedStores();
      if (r.success) { setStores(r.data.stores); setFiltered(r.data.stores); }
    } finally { setLoading(false); setRefreshing(false); }
  };

  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role);

  const typeStats = [
    { label: "Total",  value: stores.length },
    { label: "Grocery", value: stores.filter(s => s.store_type === "grocery").length },
    { label: "Super",  value: stores.filter(s => s.store_type === "supermarket").length },
    { label: "Agency", value: stores.filter(s => s.store_type === "agency").length },
  ];

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerLabel}>My Stores</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/stores/search")}
            >
              <Ionicons name="search-outline" size={18} color={C.white} />
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => router.push("/stores/create")}
              >
                <Ionicons name="add" size={20} color={C.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.roleDividerRow}>
          <View style={styles.headerDivider} />
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Assigned Locations</Text>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {typeStats.map((s, i) => (
            <View key={s.label} style={{ flex: 1, flexDirection: "row" }}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <View style={styles.statMiniDivider} />
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < typeStats.length - 1 && (
                <View style={styles.statVertDivider} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ── SEARCH BAR ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by name, district, owner..."
            placeholderTextColor="#BBBBBB"
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── LIST ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.store_id)}
        renderItem={({ item }) => <StoreCard item={item} isAdmin={isAdmin} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStores(); }}
            colors={[C.gold]}
            tintColor={C.gold}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>All Stores</Text>
            </View>
            <Text style={styles.sectionSub}>
              {filtered.length} of {stores.length} stores
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="storefront-outline" size={32} color={C.gold} />
            </View>
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptyText}>
              {search ? "Try a different search term." : "Assigned stores will appear here."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  // Header
  header: {
    backgroundColor: C.gold,
    paddingTop: 52,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  headerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  rolePill: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  rolePillText: {
    fontSize: 11,
    color: C.white,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  statMiniDivider: {
    width: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statVertDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 12,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 2,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 4,
  },
  listHeader: {
    paddingTop: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    backgroundColor: C.gold,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 13,
    color: C.muted,
    marginLeft: 11,
    lineHeight: 19,
  },

  // Store card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 13,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.goldBg,
    borderWidth: 1,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  typeBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  ownerName: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 0,
  },
  cardInnerDivider: {
    marginVertical: 9,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: C.muted,
    flex: 1,
  },
  tapHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tapHint: {
    fontSize: 11,
    color: C.gold,
    fontWeight: "600",
  },

  // Divider
  hDivider: {
    height: 1,
    backgroundColor: C.border,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: 52,
    gap: 10,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.goldBg,
    borderWidth: 1.5,
    borderColor: C.goldBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 19,
  },
});