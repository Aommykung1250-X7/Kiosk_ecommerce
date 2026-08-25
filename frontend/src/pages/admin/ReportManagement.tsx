import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Banknote,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  Tv,
  Truck,
} from "lucide-react";
import type {
  DatePreset,
  ExportFormat,
  ReportSummary,
  ReportTab,
} from "../../types/admin";
import { AdminLayout } from "../../components/admin/AdminLayout";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  LoadingState,
  SegmentedControl,
  StatCard,
  TBody,
  Table,
  TableShell,
  Td,
  TextInput,
  Th,
  THead,
  Tr,
  UnderlineTabs,
  formatBaht,
  formatCount,
  formatTime,
  toLocalDateKey,
  type TabItem,
} from "../../components/admin/ui";
import { RevenueTrendChart } from "../../components/admin/charts/RevenueTrendChart";
import { HourlyTrafficChart } from "../../components/admin/charts/HourlyTrafficChart";
import {
  HorizontalBarList,
  type BarRow,
} from "../../components/admin/charts/HorizontalBarList";
import { CHART_MONEY } from "../../components/admin/charts/chartTokens";

const REPORT_TABS: TabItem<ReportTab>[] = [
  { key: "sales", label: "ยอดขายและการเงิน" },
  { key: "products", label: "ประสิทธิภาพสินค้า" },
  { key: "kiosk", label: "การใช้งานตู้" },
];

const PRESET_LABEL: Record<Exclude<DatePreset, "custom">, string> = {
  today: "วันนี้",
  "7days": "7 วัน",
  "30days": "30 วัน",
  all: "ทั้งหมด",
};

const TOP_SELLER_COUNT = 8;

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDateKey(date);
}

export default function ReportManagement() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [datePreset, setDatePreset] = useState<DatePreset>("30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [stats, setStats] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/ditc-portal-to-manager");
      return;
    }
    try {
      if (JSON.parse(raw).role !== "admin") navigate("/unauthorized");
    } catch {
      navigate("/ditc-portal-to-manager");
    }
  }, [navigate]);

  useEffect(() => {
    if (datePreset === "custom") return;

    const today = toLocalDateKey(new Date());
    if (datePreset === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (datePreset === "7days") {
      setStartDate(daysAgo(7));
      setEndDate(today);
    } else if (datePreset === "30days") {
      setStartDate(daysAgo(30));
      setEndDate(today);
    } else {
      setStartDate("");
      setEndDate("");
    }
  }, [datePreset]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
      const response = await fetch(`/api/admin/reports/summary${query}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลรายงานได้");

      const result = await response.json();
      if (result.success) setStats(result.data);
    } catch (loadError) {
      console.error("Error fetching report stats:", loadError);
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const handleExport = (format: ExportFormat) => {
    let url = `/api/admin/reports/export?type=${activeTab}&format=${format}`;
    if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;

    if (format === "pdf") {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates((previous) => {
      const next = new Set(previous);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  /** สินค้าขายดี — เรียงตามรายได้ เพราะรายงานชุดนี้ตอบเรื่องเงินเป็นหลัก */
  const topSellers: BarRow[] = useMemo(() => {
    if (!stats?.productReportList) return [];
    return [...stats.productReportList]
      .filter((product) => product.unitsSold > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, TOP_SELLER_COUNT)
      .map((product) => ({
        id: product.id,
        label: product.name,
        value: product.totalRevenue,
        display: formatBaht(product.totalRevenue),
        meta: `${formatCount(product.unitsSold)} ชิ้น · ${product.category}`,
      }));
  }, [stats]);

  const dateRangeLabel =
    startDate && endDate ? `${startDate} ถึง ${endDate}` : "ข้อมูลทั้งหมดตั้งแต่เริ่มระบบ";

  return (
    <AdminLayout
      title="รายงาน"
      description={`สรุปยอดขาย สินค้า และการใช้งานตู้ · ${dateRangeLabel}`}
      actions={
        <Button icon={RefreshCw} onClick={() => void fetchSummary()}>
          รีเฟรช
        </Button>
      }
    >
      {/* ------------------------------------------------------------ ช่วงเวลา */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<DatePreset>
          value={datePreset}
          onChange={setDatePreset}
          items={(
            Object.keys(PRESET_LABEL) as (keyof typeof PRESET_LABEL)[]
          ).map((key) => ({ key, label: PRESET_LABEL[key] }))}
        />

        <div className="flex items-center gap-2">
          <TextInput
            type="date"
            aria-label="วันที่เริ่มต้น"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setDatePreset("custom");
            }}
            className="w-[152px]"
          />
          <span className="text-xs text-bo-muted">ถึง</span>
          <TextInput
            type="date"
            aria-label="วันที่สิ้นสุด"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setDatePreset("custom");
            }}
            className="w-[152px]"
          />
        </div>
      </Card>

      {/* --------------------------------------------------------- การ์ดสรุป */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          emphasis
          label="รายได้รวม"
          value={formatBaht(stats?.totalRevenue ?? 0)}
          icon={Banknote}
          hint="ยอดที่ชำระสำเร็จผ่านเพย์เมนต์เกตเวย์"
        />
        <StatCard
          label="คำสั่งซื้อที่ชำระแล้ว"
          value={formatCount(stats?.paidOrdersCount ?? 0)}
          unit="รายการ"
          icon={ShoppingBag}
          accent="accent"
          hint="เฉพาะรายการที่ชำระเงินเรียบร้อย"
        />
        <StatCard
          label="ผู้เปิดใช้งานตู้"
          value={formatCount(stats?.totalWakeups ?? 0)}
          unit="ครั้ง"
          icon={Tv}
          accent="warning"
          hint="จำนวนครั้งที่ตู้ถูกแตะเริ่มใช้งาน"
        />
        <StatCard
          label="สินค้าในคลัง"
          value={formatCount(stats?.totalProducts ?? 0)}
          unit="รายการ"
          icon={Package}
          accent={stats && stats.lowStockCount > 0 ? "danger" : "success"}
          hint={
            stats && stats.lowStockCount > 0
              ? `ใกล้หมด ${formatCount(stats.lowStockCount)} รายการ`
              : "ระดับสต็อกปกติ"
          }
        />
      </div>

      {/* ------------------------------------------------------ แท็บและส่งออก */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <UnderlineTabs
            className="flex-1"
            items={REPORT_TABS}
            value={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex flex-wrap items-center gap-2 pb-3">
            <Button size="sm" icon={Download} onClick={() => handleExport("excel")}>
              Excel
            </Button>
            <Button size="sm" icon={Download} onClick={() => handleExport("csv")}>
              CSV
            </Button>
            <Button size="sm" icon={FileText} onClick={() => handleExport("pdf")}>
              PDF
            </Button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <Card flush>
            <LoadingState label="กำลังประมวลผลข้อมูลรายงาน" />
          </Card>
        ) : (
          <>
            {/* ------------------------------------------- ยอดขายและการเงิน */}
            {activeTab === "sales" && (
              <div className="flex flex-col gap-5">
                <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                  <Card className="flex flex-col gap-5">
                    <CardHeader
                      title="แนวโน้มยอดขายรายวัน"
                      description="ชี้ที่กราฟเพื่อดูยอดขายและจำนวนคำสั่งซื้อของแต่ละวัน"
                      actions={
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <BarChart3 className="h-4 w-4" />
                        </span>
                      }
                    />

                    {stats && stats.dailyTrend.length > 0 ? (
                      <RevenueTrendChart rows={stats.dailyTrend} />
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="ยังไม่มียอดขายในช่วงเวลานี้"
                        description="เลือกช่วงเวลาที่กว้างขึ้น หรือรอจนมีคำสั่งซื้อที่ชำระเงินสำเร็จ"
                      />
                    )}
                  </Card>

                  <Card className="flex flex-col gap-5">
                    <CardHeader
                      title="สินค้าขายดี"
                      description={`เรียงตามรายได้ · สูงสุด ${TOP_SELLER_COUNT} อันดับ`}
                    />

                    {topSellers.length > 0 ? (
                      <HorizontalBarList rows={topSellers} color={CHART_MONEY} />
                    ) : (
                      <EmptyState
                        icon={Package}
                        title="ยังไม่มีสินค้าที่ขายได้"
                        description="เมื่อมีคำสั่งซื้อที่ชำระเงินสำเร็จ อันดับสินค้าขายดีจะขึ้นที่นี่"
                      />
                    )}
                  </Card>
                </div>

                {/* ช่องทางรับของ */}
                <Card className="flex flex-col gap-4">
                  <CardHeader
                    title="ช่องทางรับสินค้า"
                    description="สัดส่วนรายได้ระหว่างการรับที่ร้านกับการจัดส่งพัสดุ"
                  />

                  {stats && stats.deliveryBreakdown.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {stats.deliveryBreakdown.map((row) => {
                        const isDelivery = row.delivery_option === "delivery";
                        return (
                          <div
                            key={row.delivery_option}
                            className="flex items-center justify-between gap-4 rounded-xl border border-bo-line bg-slate-50/70 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  isDelivery
                                    ? "bg-sky-50 text-sky-600"
                                    : "bg-emerald-50 text-emerald-600"
                                }`}
                              >
                                {isDelivery ? (
                                  <Truck className="h-5 w-5" />
                                ) : (
                                  <Store className="h-5 w-5" />
                                )}
                              </span>
                              <div>
                                <p className="text-xs text-bo-muted">
                                  {isDelivery ? "จัดส่งพัสดุ" : "รับที่ร้าน"}
                                </p>
                                <p className="bo-nums mt-0.5 text-lg font-semibold text-bo-text">
                                  {formatBaht(row.total_amount)}
                                </p>
                              </div>
                            </div>

                            <Badge tone="neutral">
                              {formatCount(row.order_count)} คำสั่งซื้อ
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs text-bo-muted">
                      ยังไม่มีรายการชำระเงินสำเร็จในช่วงเวลานี้
                    </p>
                  )}
                </Card>

                {/* ตารางรายวัน */}
                <TableShell>
                  {stats && stats.dailyTrend.length > 0 ? (
                    <Table>
                      <THead>
                        <Th className="w-10" />
                        <Th>วันที่</Th>
                        <Th align="center">คำสั่งซื้อ</Th>
                        <Th align="right">ยอดขาย</Th>
                      </THead>

                      <TBody>
                        {stats.dailyTrend.map((row) => {
                          const expanded = expandedDates.has(row.date);
                          const orders = row.orders ?? [];

                          return (
                            <Fragment key={row.date}>
                              <Tr
                                onClick={() => toggleDate(row.date)}
                                selected={expanded}
                              >
                                <Td className="w-10 text-slate-400">
                                  {expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Td>

                                <Td className="font-medium">{row.date}</Td>

                                <Td align="center" className="bo-nums text-sm">
                                  {formatCount(row.orders_count)}
                                </Td>

                                <Td align="right" className="bo-nums font-semibold">
                                  {formatBaht(row.daily_revenue)}
                                </Td>
                              </Tr>

                              {expanded && (
                                <tr className="bo-row-enter">
                                  <td colSpan={4} className="bg-slate-50/70 px-4 py-3">
                                    {orders.length > 0 ? (
                                      <ul className="flex flex-col gap-1.5">
                                        {orders.map((order) => (
                                          <li
                                            key={order.id}
                                            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-bo-line bg-white px-3 py-2"
                                          >
                                            <span
                                              className="font-bo-mono min-w-0 flex-1 truncate text-[11px] text-bo-muted"
                                              title={order.id}
                                            >
                                              {order.id}
                                            </span>
                                            <span className="text-[11px] text-bo-muted">
                                              {formatTime(order.created_at)}
                                            </span>
                                            <Badge
                                              size="sm"
                                              tone={
                                                order.delivery_option === "delivery"
                                                  ? "info"
                                                  : "success"
                                              }
                                            >
                                              {order.delivery_option === "delivery"
                                                ? "จัดส่ง"
                                                : "รับที่ร้าน"}
                                            </Badge>
                                            <span className="bo-nums w-24 text-right text-xs font-semibold text-bo-text">
                                              {formatBaht(order.total_amount)}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="py-2 text-center text-xs text-bo-muted">
                                        ไม่มีรายละเอียดคำสั่งซื้อของวันนี้
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </TBody>
                    </Table>
                  ) : (
                    <EmptyState
                      icon={BarChart3}
                      title="ไม่มีรายการยอดขายในช่วงเวลานี้"
                      description="ลองเลือกช่วงเวลาอื่น หรือกดทั้งหมดเพื่อดูข้อมูลตั้งแต่เริ่มระบบ"
                    />
                  )}
                </TableShell>
              </div>
            )}

            {/* ---------------------------------------------- ประสิทธิภาพสินค้า */}
            {activeTab === "products" && (
              <TableShell>
                {stats && stats.productReportList.length > 0 ? (
                  <Table>
                    <THead>
                      <Th>สินค้า</Th>
                      <Th>หมวดหมู่</Th>
                      <Th align="right">ราคา</Th>
                      <Th align="center">คงเหลือ</Th>
                      <Th align="right">ยอดเข้าชม</Th>
                      <Th align="right">ขายได้</Th>
                      <Th align="right">รายได้</Th>
                      <Th align="right">อัตราการซื้อ</Th>
                    </THead>

                    <TBody>
                      {stats.productReportList.map((product) => (
                        <Tr key={product.id}>
                          <Td>
                            <span className="block text-sm font-medium">{product.name}</span>
                            <span className="font-bo-mono block text-[11px] text-slate-400">
                              #{String(product.id).padStart(4, "0")}
                            </span>
                          </Td>
                          <Td className="text-sm text-bo-muted">{product.category}</Td>
                          <Td align="right" className="bo-nums text-sm">
                            {formatBaht(product.price)}
                          </Td>
                          <Td align="center">
                            <Badge
                              size="sm"
                              tone={
                                product.stock <= 0
                                  ? "danger"
                                  : product.stock <= 5
                                    ? "lowstock"
                                    : "neutral"
                              }
                            >
                              {formatCount(product.stock)}
                            </Badge>
                          </Td>
                          <Td align="right" className="bo-nums text-sm text-bo-muted">
                            {formatCount(product.views)}
                          </Td>
                          <Td align="right" className="bo-nums text-sm font-medium">
                            {formatCount(product.unitsSold)}
                          </Td>
                          <Td align="right" className="bo-nums text-sm font-semibold">
                            {formatBaht(product.totalRevenue)}
                          </Td>
                          <Td align="right" className="bo-nums text-sm text-bo-accent">
                            {product.conversionRate}
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Package}
                    title="ไม่มีข้อมูลสินค้าในระบบ"
                    description="เพิ่มสินค้าในหน้าคลังสินค้าก่อน แล้วรายงานนี้จะมีข้อมูลให้ดู"
                  />
                )}
              </TableShell>
            )}

            {/* --------------------------------------------------- การใช้งานตู้ */}
            {activeTab === "kiosk" && (
              <div className="flex flex-col gap-5">
                <Card className="flex flex-col gap-5">
                  <CardHeader
                    title="คำสั่งซื้อตามช่วงเวลาของวัน"
                    description="ชี้ที่แท่งเพื่อดูจำนวนคำสั่งซื้อและยอดเงินของชั่วโมงนั้น"
                  />

                  {stats && stats.hourlyDistribution.length > 0 ? (
                    <HourlyTrafficChart rows={stats.hourlyDistribution} />
                  ) : (
                    <EmptyState
                      icon={BarChart3}
                      title="ไม่มีคำสั่งซื้อในช่วงเวลาที่เลือก"
                      description="เลือกช่วงวันที่กว้างขึ้นเพื่อดูรูปแบบการใช้งานตลอดวัน"
                    />
                  )}
                </Card>

                <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
                  <Card className="flex flex-col gap-4">
                    <CardHeader
                      title="คำค้นหายอดนิยม"
                      description="ปุ่มค้นหาด่วนที่ตั้งไว้บนหน้าตู้"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {stats && stats.popularTags.length > 0 ? (
                        stats.popularTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-bo-line bg-white px-3 py-1 text-xs font-medium text-bo-text"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">ยังไม่ได้ตั้งคำค้นหา</span>
                      )}
                    </div>
                  </Card>

                  <TableShell>
                    {stats && stats.hourlyDistribution.length > 0 ? (
                      <Table>
                        <THead>
                          <Th>ช่วงเวลา</Th>
                          <Th align="center">คำสั่งซื้อ</Th>
                          <Th align="right">ยอดเงิน</Th>
                        </THead>
                        <TBody>
                          {stats.hourlyDistribution.map((row) => (
                            <Tr key={row.hour}>
                              <Td className="font-medium">{row.hour}</Td>
                              <Td align="center" className="bo-nums text-sm">
                                {formatCount(row.orders)}
                              </Td>
                              <Td align="right" className="bo-nums font-semibold">
                                {formatBaht(row.revenue)}
                              </Td>
                            </Tr>
                          ))}
                        </TBody>
                      </Table>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="ไม่มีข้อมูลรายชั่วโมง"
                        description="ตารางนี้จะมีข้อมูลเมื่อมีคำสั่งซื้อที่ชำระเงินสำเร็จในช่วงที่เลือก"
                      />
                    )}
                  </TableShell>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
