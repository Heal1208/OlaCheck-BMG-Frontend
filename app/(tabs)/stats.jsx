import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AlertBox, { useAlert } from "../../components/AlertBox";
import SkeletonPulse from "../../components/SkeletonPulse";
import TabHero from "../../components/TabHero";
import { UI } from "../../constants/theme";
import { exportInventoryReport, getInventoryStats } from "../../src/services/statsService";

// ─── Colour palette ───────────────────────────────────────────
const PALETTE = ["#3178F6", "#29B36A", "#E07B2E", "#7C3CE0"];
const TYPE_MAP = {
  grocery:     { color: "#29B36A", bg: "#E8F8EE", label: "Tạp hóa"  },
  supermarket: { color: "#3178F6", bg: "#EAF4FF", label: "Siêu thị" },
  agency:      { color: "#E07B2E", bg: "#FFF1E2", label: "Đại lý"   },
};

// ════════════════════════════════════════════════════════════════
// PIE CHART  (SVG on web · horizontal bars on mobile)
// ════════════════════════════════════════════════════════════════
function PieChart({ data, size = 190 }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return <Text style={shared.noData}>Chưa có dữ liệu.</Text>;

  const cx = size / 2;
  const cy = size / 2;
  const R  = size / 2 - 20;   // outer radius
  const r  = R * 0.42;         // inner hole radius

  let angle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const frac  = item.value / total;
    const start = angle;
    const end   = angle + frac * 2 * Math.PI;
    angle = end;
    const mid   = start + (end - start) / 2;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
    const lx = cx + (R * 0.68) * Math.cos(mid);
    const ly = cy + (R * 0.68) * Math.sin(mid);
    const pct = Math.round(frac * 100);
    return {
      path: `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${frac > 0.5 ? 1 : 0},1 ${x2},${y2} Z`,
      color: item.color || PALETTE[i % PALETTE.length],
      lx, ly, pct, frac,
    };
  });

  // ── Web: real SVG ─────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={pie.wrap}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
             style={{ overflow: "visible" }}>
          {slices.map((s, i) => (
            <g key={i}>
              <path d={s.path} fill={s.color} stroke="#fff" strokeWidth="2.5" />
              {s.frac > 0.07 && (
                <text x={s.lx} y={s.ly} textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff" fontSize="11" fontWeight="700"
                      fontFamily="Calibri, sans-serif">
                  {s.pct}%
                </text>
              )}
            </g>
          ))}
          {/* donut hole */}
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
          <text x={cx} y={cy - 8} textAnchor="middle"
                fill="#24324A" fontSize="22" fontWeight="800" fontFamily="Calibri,sans-serif">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle"
                fill="#8A96A8" fontSize="10" fontFamily="Calibri,sans-serif">
            tổng tồn kho
          </text>
        </svg>

        {/* Legend */}
        <View style={pie.legend}>
          {data.map((item, i) => (
            <View key={i} style={pie.legendRow}>
              <View style={[pie.dot, { backgroundColor: item.color || PALETTE[i % PALETTE.length] }]} />
              <Text style={pie.legendLabel} numberOfLines={2}>{item.label}</Text>
              <Text style={pie.legendVal}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Mobile: horizontal progress bars ─────────────────────
  const max = Math.max(...data.map(d => d.value || 0), 1);
  return (
    <View style={pie.mobileWrap}>
      {data.map((item, i) => {
        const color = item.color || PALETTE[i % PALETTE.length];
        const pct   = Math.round((item.value / total) * 100);
        const w     = `${Math.max((item.value / max) * 100, 3)}%`;
        return (
          <View key={i} style={pie.mRow}>
            <View style={pie.mMeta}>
              <View style={[pie.dot, { backgroundColor: color }]} />
              <Text style={pie.mLabel}>{item.label}</Text>
              <Text style={[pie.mPct, { color }]}>{pct}%</Text>
            </View>
            <View style={pie.mBarBg}>
              <View style={[pie.mBarFill, { width: w, backgroundColor: color }]} />
            </View>
            <Text style={pie.mVal}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// BAR CHART  (animated)
// ════════════════════════════════════════════════════════════════
function BarChart({ data }) {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  const ran   = useRef(false);

  if (!ran.current) {
    ran.current = true;
    Animated.stagger(
      70,
      anims.map(a => Animated.spring(a, { toValue: 1, useNativeDriver: false, tension: 55, friction: 9 }))
    ).start();
  }

  if (!data?.length) return <Text style={shared.noData}>Chưa có dữ liệu.</Text>;

  const max     = Math.max(...data.map(d => d.value || 0), 1);
  const MAX_H   = 150;
  const Y_TICKS = [max, Math.round(max * 0.5), 0];

  return (
    <View style={barS.container}>
      {/* Y-axis */}
      <View style={barS.yAxis}>
        {Y_TICKS.map((v, i) => (
          <Text key={i} style={barS.yTick}>{v}</Text>
        ))}
      </View>

      {/* Bars */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={[barS.barsRow, { height: MAX_H + 56 }]}>
          {/* Grid lines */}
          <View style={[barS.gridLine, { bottom: 28 + MAX_H }]} />
          <View style={[barS.gridLine, { bottom: 28 + MAX_H * 0.5 }]} />
          <View style={[barS.gridLine, { bottom: 28 }]} />

          {data.map((item, i) => {
            const color    = item.color || PALETTE[i % PALETTE.length];
            const h        = ((item.value || 0) / max) * MAX_H;
            const anim     = anims[i] ?? new Animated.Value(1);
            const animH    = anim.interpolate({ inputRange: [0, 1], outputRange: [0, h] });

            return (
              <View key={i} style={barS.barWrap}>
                {/* value label */}
                <Animated.Text style={[barS.barTopLabel, {
                  opacity: anim,
                  bottom: anim.interpolate({ inputRange: [0, 1], outputRange: [28, h + 30] }),
                }]}>
                  {item.value}
                </Animated.Text>

                {/* bar column */}
                <View style={[barS.barColumn, { height: MAX_H }]}>
                  <Animated.View style={[barS.bar, { height: animH, backgroundColor: color }]} />
                </View>

                {/* label */}
                <Text style={barS.barLabel} numberOfLines={2}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// SUMMARY CARD
// ════════════════════════════════════════════════════════════════
function SummaryCard({ label, value, icon, color, sub }) {
  return (
    <View style={[styles.sumCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <View style={[styles.sumIcon, { backgroundColor: color + "1A" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.sumVal}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
      {sub ? <Text style={styles.sumSub}>{sub}</Text> : null}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════
export default function StatsScreen() {
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [chartMode, setChartMode]     = useState("bar"); // "bar" | "pie"
  const { alertConfig, showAlert, hideAlert } = useAlert();

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const res = await getInventoryStats();
      if (res.success) setStats(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportInventoryReport();
      if (!result.success) showAlert("Xuất thất bại", result.message);
    } catch {
      showAlert("Lỗi", "Không thể xuất báo cáo. Vui lòng thử lại.");
    } finally { setExporting(false); }
  };

  if (loading) return (
    <View style={styles.center}>
      <SkeletonPulse style={{ width: "70%", height: 26, borderRadius: 14 }} />
    </View>
  );

  const summary   = stats?.summary   || {};
  const byProduct = stats?.by_product || [];
  const byStore   = stats?.by_store   || [];
  const byType    = stats?.by_type    || [];

  const productChartData = byProduct.map((p, i) => ({
    label: p.sku,
    value: p.total_qty || 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const typeChartData = byType.map(t => ({
    label: TYPE_MAP[t.store_type]?.label || t.store_type,
    value: t.total_qty || 0,
    color: TYPE_MAP[t.store_type]?.color || "#888",
  }));

  return (
    <View style={styles.container}>
      <AlertBox config={alertConfig} onHide={hideAlert} />

      <TabHero
        eyebrow="Analytics"
        title="Inventory Stats"
        right={
          <TouchableOpacity style={styles.heroBtn} onPress={handleExport} disabled={exporting}>
            {exporting
              ? <ActivityIndicator size="small" color="#5B5214" />
              : <Ionicons name="download-outline" size={20} color="#5B5214" />}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[UI.light.primary]} tintColor={UI.light.primary}
          />
        }
      >
        {/* ── Summary Grid ──────────────────────────────────── */}
        <View style={styles.sumGrid}>
          <SummaryCard label="Tổng tồn kho" value={summary.grand_total_qty || 0}
            icon="cube-outline" color="#3178F6" sub="toàn bộ điểm bán" />
          <SummaryCard label="Cảnh báo thấp" value={summary.open_low_stock || 0}
            icon="warning-outline" color="#E03030" sub="chưa xử lý" />
          <SummaryCard label="Sản phẩm" value={summary.total_products || 0}
            icon="layers-outline" color="#29B36A" />
          <SummaryCard label="Cửa hàng" value={summary.total_stores || 0}
            icon="storefront-outline" color="#E07B2E" />
        </View>

        {/* ── Product Chart ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.secTitle}>Tồn kho theo sản phẩm</Text>
              <Text style={styles.secSub}>Số lượng tổng trên toàn bộ cửa hàng</Text>
            </View>
            {/* Bar / Pie toggle */}
            <View style={styles.toggle}>
              {[
                { mode: "bar", icon: "bar-chart-outline" },
                { mode: "pie", icon: "pie-chart-outline" },
              ].map(({ mode, icon }) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.toggleBtn, chartMode === mode && styles.toggleBtnOn]}
                  onPress={() => setChartMode(mode)}
                >
                  <Ionicons name={icon} size={16}
                    color={chartMode === mode ? UI.light.primaryDark : UI.light.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            {productChartData.length === 0
              ? <Text style={shared.noData}>Chưa có dữ liệu tồn kho.</Text>
              : chartMode === "bar"
                ? <BarChart data={productChartData} />
                : <PieChart data={productChartData} size={200} />
            }
          </View>
        </View>

        {/* ── Store Type Pie ──────────────────────────────────── */}
        {typeChartData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Phân bổ theo loại kênh</Text>
            <Text style={styles.secSub}>Tỷ trọng tồn kho theo kênh phân phối</Text>
            <View style={styles.card}>
              <PieChart data={typeChartData} size={190} />
            </View>
          </View>
        )}

        {/* ── Top Stores ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Top cửa hàng</Text>
          <Text style={styles.secSub}>Xếp hạng theo số lượng tồn kho</Text>
          <View style={styles.card}>
            {byStore.length === 0 ? (
              <Text style={shared.noData}>Chưa có dữ liệu.</Text>
            ) : (
              <>
                {/* table header */}
                <View style={tblS.headerRow}>
                  <Text style={[tblS.hCell, { flex: 3 }]}>Cửa hàng</Text>
                  <Text style={tblS.hCell}>Loại</Text>
                  <Text style={[tblS.hCell, { textAlign: "right" }]}>SL</Text>
                </View>

                {byStore.slice(0, 8).map((s, i) => {
                  const tc   = TYPE_MAP[s.store_type] || { color: "#888", bg: "#EEE", label: s.store_type };
                  const maxQ = byStore[0]?.total_qty || 1;
                  const pct  = ((s.total_qty || 0) / maxQ) * 100;

                  return (
                    <View key={s.store_id} style={[tblS.row, i % 2 === 1 && tblS.altRow]}>
                      <View style={{ flex: 3, paddingRight: 8 }}>
                        <Text style={tblS.storeName} numberOfLines={1}>{s.store_name}</Text>
                        <View style={tblS.miniBarBg}>
                          <View style={[tblS.miniBarFill, {
                            width: `${Math.max(pct, 3)}%`,
                            backgroundColor: tc.color,
                          }]} />
                        </View>
                      </View>
                      <View style={{ justifyContent: "center" }}>
                        <View style={[tblS.badge, { backgroundColor: tc.bg }]}>
                          <Text style={[tblS.badgeText, { color: tc.color }]}>{tc.label}</Text>
                        </View>
                      </View>
                      <Text style={tblS.qty}>{s.total_qty || 0}</Text>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>

        {/* ── Export Card ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Xuất báo cáo Excel</Text>
          <Text style={styles.secSub}>File .xlsx — 2 trang, định dạng màu sắc chuyên nghiệp</Text>

          <TouchableOpacity
            style={[styles.exportCard, exporting && { opacity: 0.65 }]}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.85}
          >
            {/* Left */}
            <View style={styles.exportLeft}>
              <View style={styles.xlsxIcon}>
                <Ionicons name="document-text" size={30} color="#1A6B3C" />
                <Text style={styles.xlsxExt}>.xlsx</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportTitle}>BMG_inventory.xlsx</Text>
                <Text style={styles.exportDesc}>
                  Sheet 1: Chi tiết · Sheet 2: Tổng hợp sản phẩm
                </Text>
                <View style={styles.tagRow}>
                  {["Cửa hàng", "SKU", "Số lượng", "Ngày", "Nhân viên"].map(t => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Button */}
            <View style={[styles.exportBtn, exporting && { backgroundColor: "#aaa" }]}>
              {exporting
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="download-outline" size={17} color="#fff" />
                    <Text style={styles.exportBtnText}>Export</Text>
                  </>
              }
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Shared ───────────────────────────────────────────────────
const shared = StyleSheet.create({
  noData: { textAlign: "center", fontSize: 13, color: UI.light.muted, paddingVertical: 24 },
});

// ─── Pie Styles ───────────────────────────────────────────────
const pie = StyleSheet.create({
  wrap:       { flexDirection: "row", alignItems: "center", gap: 18 },
  legend:     { flex: 1, gap: 12 },
  legendRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  dot:        { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendLabel:{ flex: 1, fontSize: 12, color: "#444", lineHeight: 16 },
  legendVal:  { fontSize: 14, fontWeight: "800", color: "#111" },
  // mobile
  mobileWrap: { gap: 16 },
  mRow:       { gap: 6 },
  mMeta:      { flexDirection: "row", alignItems: "center", gap: 8 },
  mLabel:     { flex: 1, fontSize: 12, color: "#555" },
  mPct:       { fontSize: 12, fontWeight: "700" },
  mBarBg:     { height: 10, backgroundColor: "#F0F2F8", borderRadius: 5, overflow: "hidden" },
  mBarFill:   { height: 10, borderRadius: 5 },
  mVal:       { fontSize: 12, fontWeight: "700", color: "#333", textAlign: "right" },
});

// ─── Bar Styles ───────────────────────────────────────────────
const barS = StyleSheet.create({
  container:   { flexDirection: "row", alignItems: "flex-end" },
  yAxis:       { justifyContent: "space-between", paddingBottom: 36, paddingRight: 6, width: 32 },
  yTick:       { fontSize: 10, color: "#B0B8C8", textAlign: "right" },
  barsRow:     { flexDirection: "row", alignItems: "flex-end", paddingBottom: 0, gap: 10, position: "relative" },
  gridLine:    { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#F0F2F8" },
  barWrap:     { alignItems: "center", width: 56, position: "relative" },
  barTopLabel: { position: "absolute", fontSize: 11, fontWeight: "800", color: "#333" },
  barColumn:   { width: 36, justifyContent: "flex-end", overflow: "hidden" },
  bar:         { width: "100%", borderRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  barLabel:    { marginTop: 8, fontSize: 10, color: "#7A8499", textAlign: "center", lineHeight: 14 },
});

// ─── Table Styles ─────────────────────────────────────────────
const tblS = StyleSheet.create({
  headerRow:   { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "#E9EDF5", marginBottom: 2 },
  hCell:       { flex: 1, fontSize: 10, fontWeight: "700", color: "#9AA3B2", textTransform: "uppercase", letterSpacing: 0.5 },
  row:         { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F5F9", gap: 8 },
  altRow:      { backgroundColor: "#FAFBFF" },
  storeName:   { fontSize: 13, fontWeight: "700", color: "#1A2B3C" },
  miniBarBg:   { height: 4, backgroundColor: "#EEF1F6", borderRadius: 3, marginTop: 5, overflow: "hidden" },
  miniBarFill: { height: 4, borderRadius: 3 },
  badge:       { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 10, fontWeight: "700" },
  qty:         { width: 46, fontSize: 15, fontWeight: "800", color: "#1A2B3C", textAlign: "right" },
});

// ─── Main Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.light.background },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: UI.light.background },

  heroBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },

  // Summary
  sumGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  sumCard:  {
    width: "47.5%",
    backgroundColor: UI.light.card,
    borderRadius: 18, padding: 14,
    shadowColor: "#D9DEE8", shadowOpacity: 0.2,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  sumIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  sumVal:   { fontSize: 26, fontWeight: "800", color: UI.light.text },
  sumLabel: { fontSize: 11, fontWeight: "600", color: UI.light.muted, marginTop: 1 },
  sumSub:   { fontSize: 10, color: UI.light.muted },

  // Section
  section:     { marginTop: 22 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  secTitle:    { fontSize: 17, fontWeight: "800", color: UI.light.text },
  secSub:      { fontSize: 12, color: UI.light.muted, marginTop: 3, marginBottom: 12 },

  // Chart toggle
  toggle:      { flexDirection: "row", backgroundColor: "#ECEEF3", borderRadius: 10, padding: 3, gap: 2, marginTop: 2 },
  toggleBtn:   { width: 34, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  toggleBtnOn: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },

  card: {
    backgroundColor: UI.light.card, borderRadius: 20, padding: 16,
    shadowColor: "#D9DEE8", shadowOpacity: 0.2,
    shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },

  // Export
  exportCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: UI.light.card, borderRadius: 20, padding: 18,
    shadowColor: "#D9DEE8", shadowOpacity: 0.22,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5,
    borderWidth: 1.5, borderColor: "#D4EAD8",
  },
  exportLeft:    { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 14 },
  xlsxIcon:      { width: 54, height: 54, borderRadius: 16, backgroundColor: "#E8F8EE", alignItems: "center", justifyContent: "center" },
  xlsxExt:       { fontSize: 9, fontWeight: "800", color: "#1A6B3C", marginTop: 2 },
  exportTitle:   { fontSize: 14, fontWeight: "800", color: UI.light.text },
  exportDesc:    { fontSize: 11, color: UI.light.muted, marginTop: 3 },
  tagRow:        { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  tag:           { backgroundColor: "#F0F2F8", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:       { fontSize: 10, color: "#666", fontWeight: "600" },
  exportBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#1A6B3C", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  exportBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});