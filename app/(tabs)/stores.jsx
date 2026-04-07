import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TabHero from "../../components/TabHero";
import SkeletonPulse from "../../components/SkeletonPulse";
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";
import { UI } from "../../constants/theme";

const TYPE_STYLE = {
  grocery: { bg: "#F6F1B4", text: "#8A7E18" },
  supermarket: { bg: "#EAF4FF", text: "#3178F6" },
  agency: { bg: "#E8F8EE", text: "#29B36A" },
};

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StoreCard = ({ item, canEdit, canCheckin }) => {
  const typeStyle = TYPE_STYLE[item.store_type] || { bg: "#EEF1F6", text: UI.light.muted };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="storefront-outline" size={20} color={UI.light.primaryDark} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.store_name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                {item.store_type}
              </Text>
            </View>
          </View>
          <Text style={styles.ownerName} numberOfLines={1}>
            {item.owner_name}
          </Text>
        </View>
      </View>

      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={UI.light.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.address}, {item.district}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={14} color={UI.light.muted} />
          <Text style={styles.metaText}>{item.phone}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {canCheckin && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/checkins/checkin",
                params: { store: JSON.stringify(item) },
              })
            }
          >
            <Ionicons name="scan-outline" size={15} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function StoresScreen() {
  const [stores, setStores] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStores();
    }, [])
  );

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(stores);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      stores.filter(
        (store) =>
          store.store_name.toLowerCase().includes(q) ||
          store.district.toLowerCase().includes(q) ||
          store.owner_name.toLowerCase().includes(q)
      )
    );
  }, [search, stores]);

  const fetchStores = async () => {
    try {
      const result = await getAssignedStores();
      if (result.success) {
        setStores(result.data.stores);
        setFiltered(result.data.stores);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const role = currentUser?.role;
  const canEdit = role === "Admin";
  const canCheckin = role === "Admin" || role === "Manager" || role === "Staff";

  const typeStats = [
    { label: "Total", value: stores.length },
    { label: "Grocery", value: stores.filter((store) => store.store_type === "grocery").length },
    { label: "Super", value: stores.filter((store) => store.store_type === "supermarket").length },
    { label: "Agency",  value: stores.filter((store) => store.store_type === "agency").length },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <SkeletonPulse style={styles.loadingSkeleton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabHero
        eyebrow="Operations"
        title="My Stores"
      >
        <TouchableOpacity activeOpacity={0.9} style={styles.searchBar} onPress={() => null}>
          <Ionicons name="search-outline" size={17} color={UI.light.primaryDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by store, district, owner..."
            placeholderTextColor="#7C859C"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={UI.light.primaryDark} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

{/*         <View style={styles.statsRow}> */}
{/*           {typeStats.map((stat) => ( */}
{/*             <StatCard key={stat.label} label={stat.label} value={stat.value} /> */}
{/*           ))} */}
{/*         </View> */}
      </TabHero>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.store_id)}
        renderItem={({ item }) => (
          <StoreCard item={item} canEdit={canEdit} canCheckin={canCheckin} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStores();
            }}
            colors={[UI.light.primary]}
            tintColor={UI.light.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Store Directory</Text>
            <Text style={styles.sectionSub}>
              {filtered.length} of {stores.length} stores available
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="storefront-outline" size={32} color={UI.light.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptyText}>
              {search ? "Try another keyword." : "Assigned stores will appear here."}
            </Text>
            {canEdit ? (
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/stores/create")}>
                <Text style={styles.emptyButtonText}>Add Store</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.emptyButtonOutline} onPress={fetchStores}>
                <Text style={styles.emptyButtonOutlineText}>Refresh List</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.light.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.light.background,
  },
  loadingSkeleton: {
    width: "70%",
    height: 26,
    borderRadius: 14,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
  },
  heroButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: UI.light.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: UI.light.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: UI.light.muted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 118,
  },
  listHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: UI.light.text,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: UI.light.muted,
  },
  card: {
    backgroundColor: UI.light.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#D9DEE8",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: UI.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  storeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: UI.light.text,
  },
  ownerName: {
    marginTop: 4,
    fontSize: 13,
    color: UI.light.muted,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  metaSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: UI.light.border,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: UI.light.muted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: UI.light.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: UI.light.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 46,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: UI.light.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: UI.light.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: UI.light.muted,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    minWidth: "60%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: UI.light.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyButtonOutline: {
    marginTop: 16,
    minWidth: "60%",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: UI.light.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonOutlineText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.light.primaryDark,
  },
});
