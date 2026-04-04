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
import { getUser } from "../../src/services/authService";
import { getAssignedStores } from "../../src/services/storeService";

const UI = {
  primary: "#E7DA66",
  primaryDark: "#C6B83C",
  primarySoft: "#F6F1B4",
  background: "#F6F7FB",
  card: "#FFFFFF",
  text: "#24324A",
  muted: "#7B8798",
  border: "#E9EDF5",
  success: "#29B36A",
  blue: "#3D8DFF",
};

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
  const typeStyle = TYPE_STYLE[item.store_type] || { bg: "#EEF1F6", text: UI.muted };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="storefront-outline" size={20} color={UI.primaryDark} />
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
          <Ionicons name="location-outline" size={14} color={UI.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.address}, {item.district}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={14} color={UI.muted} />
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
{/*         {canEdit && ( */}
{/*           <TouchableOpacity */}
{/*             style={styles.secondaryButton} */}
{/*             onPress={() => */}
{/*               router.push({ */}
{/*                 pathname: "/stores/edit", */}
{/*                 params: { store: JSON.stringify(item) }, */}
{/*               }) */}
{/*             } */}
{/*           > */}
{/*             <Ionicons name="create-outline" size={15} color={UI.primaryDark} /> */}
{/*             <Text style={styles.secondaryButtonText}>Edit</Text> */}
{/*           </TouchableOpacity> */}
{/*         )} */}
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
  const canEdit = role === "Admin" || role === "Manager";
  const canCheckin = role === "Admin" || role === "Manager" || role === "Staff";

  const typeStats = [
    { label: "Total", value: stores.length },
    { label: "Grocery", value: stores.filter((store) => store.store_type === "grocery").length },
    { label: "Super", value: stores.filter((store) => store.store_type === "supermarket").length },
    { label: "Agency", value: stores.filter((store) => store.store_type === "agency").length },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={UI.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabHero
        eyebrow="Operations"
        title="My Stores"
        right={(
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/stores/search")}>
              <Ionicons name="search-outline" size={18} color="#5B5214" />
            </TouchableOpacity>
            {canEdit && (
              <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/stores/create")}>
                <Ionicons name="add" size={20} color="#5B5214" />
              </TouchableOpacity>
            )}
          </View>
        )}
      >
        <TouchableOpacity activeOpacity={0.9} style={styles.searchBar} onPress={() => null}>
          <Ionicons name="search-outline" size={17} color="#FFFCE7" />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by store, district, owner..."
            placeholderTextColor="#FFFCE7"
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color="#FFFCE7" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {typeStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>
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
            colors={[UI.primary]}
            tintColor={UI.primary}
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
              <Ionicons name="storefront-outline" size={32} color={UI.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptyText}>
              {search ? "Try another keyword." : "Assigned stores will appear here."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.background,
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
    color: "#5B5214",
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
    color: "#5B5214",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#FFFCE7",
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
    color: UI.text,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 13,
    color: UI.muted,
  },
  card: {
    backgroundColor: UI.card,
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
    backgroundColor: UI.primarySoft,
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
    color: UI.text,
  },
  ownerName: {
    marginTop: 4,
    fontSize: 13,
    color: UI.muted,
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
    borderTopColor: UI.border,
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
    color: UI.muted,
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
    backgroundColor: UI.primaryDark,
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
    backgroundColor: UI.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI.primaryDark,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 46,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: UI.text,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: UI.muted,
    textAlign: "center",
  },
});
