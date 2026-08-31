import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  LuBanknote,
  LuUsers,
  LuUserPlus,
  LuCalendarCheck,
  LuTrophy,
  LuClock,
  LuWallet,
  LuChevronRight,
  LuSparkles,
} from "react-icons/lu";

const BRAND_COLORS = { "Modelha DK": "#197e88", Depilclinik: "#c026d3" };

const PERIODS = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
];

const StatCard = ({ icon: Icon, label, value, color = "#197e88" }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs font-bold text-accent uppercase">{label}</p>
      <p className="text-2xl font-black text-primary">{value}</p>
    </div>
  </div>
);

// Clasifica una cita en "Hoy", "Mañana" o "Después" comparando solo la fecha
const getDayBucket = (dateValue) => {
  const apptDate = new Date(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const apptDay = new Date(apptDate);
  apptDay.setHours(0, 0, 0, 0);

  if (apptDay.getTime() === today.getTime()) return "Hoy";
  if (apptDay.getTime() === tomorrow.getTime()) return "Mañana";
  return "Después";
};

const BUCKET_ORDER = ["Hoy", "Mañana", "Después"];
const BUCKET_COLORS = {
  Hoy: "bg-secondary/10 text-secondary",
  Mañana: "bg-gold/10 text-gold",
  Después: "bg-gray-100 text-gray-500",
};

const toISO = (d) => d.toISOString().slice(0, 10);
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const getRangeForPeriod = (period) => {
  const now = new Date();

  if (period === "hoy") {
    const start = startOfDay(now);
    return { startDate: toISO(start), endDate: toISO(start) };
  }
  if (period === "semana") {
    const day = now.getDay(); // 0 = domingo
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = startOfDay(now);
    monday.setDate(monday.getDate() - diffToMonday);
    return { startDate: toISO(monday), endDate: toISO(now) };
  }
  // "mes" (default) — mes calendario completo, igual que en IngresosPage
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISO(firstDayMonth), endDate: toISO(lastDayMonth) };
};
const getCurrentMonthRange = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISO(first), endDate: toISO(last) };
};

const formatAxisLabel = (value) => `$${(value / 1000).toFixed(0)}k`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const AdminOverview = ({
  userRole,
  userName,
  onNavigate,
  onAttendAppointment,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("mes");
  const [marca, setMarca] = useState("");

  const [summary, setSummary] = useState({
    totalAppointments: 0,
    clientsAttended: 0,
    newClients: 0,
  });
  const [income, setIncome] = useState(0);
  const [topTreatments, setTopTreatments] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [pendingAccountsSummary, setPendingAccountsSummary] = useState({
    totalPending: 0,
    count: 0,
  });
  const [dailyIncome, setDailyIncome] = useState([]);

  const formatShortName = (fullName) => {
    if (!fullName) return "—";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
    return fullName;
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value || 0);

  const formatTime = (value) =>
    new Date(value).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDayLabel = (dateStr) => {
    const [, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  const fetchAll = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const { startDate, endDate } = getRangeForPeriod(period);
        const params = { startDate, endDate, ...(marca ? { marca } : {}) };

        const chartRange = getCurrentMonthRange();
        const chartParams = { ...chartRange, ...(marca ? { marca } : {}) };

        const [
          summaryRes,
          incomeRes,
          dailyIncomeRes,
          treatmentsRes,
          performanceRes,
          upcomingRes,
          pendingAccountsRes,
        ] = await Promise.all([
          api.get("/dashboard/summary-range", { params }),
          api.get("/sales/income-range", { params }),
          api.get("/sales/daily-income-range", { params: chartParams }),
          api.get("/dashboard/top-treatments-range", { params }),
          api.get("/dashboard/collaborator-performance-range", { params }),
          api.get("/dashboard/upcoming-appointments"),
          api.get("/sales/pending-accounts", {
            params: marca ? { marca } : {},
          }),
        ]);

        setSummary(summaryRes.data);
        setIncome(incomeRes.data.totalIncome);
        setDailyIncome(dailyIncomeRes.data || []);
        setTopTreatments(treatmentsRes.data);
        setPerformance(performanceRes.data);
        setUpcoming(upcomingRes.data);

        const pendingSales = pendingAccountsRes.data.pendingSales || [];
        const pendingPackages = pendingAccountsRes.data.pendingPackages || [];
        const totalPending =
          pendingSales.reduce(
            (sum, s) =>
              sum + (parseFloat(s.totalAmount) - parseFloat(s.amountPaid)),
            0,
          ) +
          pendingPackages.reduce(
            (sum, p) =>
              sum + (parseFloat(p.totalPrice) - parseFloat(p.amountPaid)),
            0,
          );
        setPendingAccountsSummary({
          totalPending,
          count: pendingSales.length + pendingPackages.length,
        });

        setError("");
      } catch (err) {
        setError("No se pudo cargar la información del dashboard.");
        console.error(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [period, marca],
  );

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    const silent = !isFirstLoad.current;
    isFirstLoad.current = false;
    fetchAll({ silent });

    const interval = setInterval(() => fetchAll({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const maxPerformanceCount = Math.max(...performance.map((p) => p.count), 1);

  const groupedUpcoming = upcoming.reduce((acc, appt) => {
    const bucket = getDayBucket(appt.startTime);
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(appt);
    return acc;
  }, {});

  if (loading) {
    return (
      <p className="text-secondary text-center font-medium p-8 text-sm">
        Cargando dashboard...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-center font-medium p-8 text-sm">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="bg-linear-to-r from-secondary to-depil p-6 rounded-2xl shadow-sm flex items-center gap-4 text-white">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <LuSparkles size={26} />
        </div>
        <div>
          <p className="text-xl font-black flex items-center gap-2">
            {getGreeting()}, {userName?.split(" ")[0] || "administrador"}
            <span className="text-3xl">👋</span>
          </p>
          <p className="text-sm text-white/80 mt-0.5">
            Aquí puedes revisar cómo va todo.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                period === p.value
                  ? "bg-primary text-white"
                  : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["", "Modelha DK", "Depilclinik"].map((brand) => (
            <button
              key={brand || "todas"}
              onClick={() => setMarca(brand)}
              className="px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm"
              style={
                marca === brand
                  ? {
                      backgroundColor: brand ? BRAND_COLORS[brand] : "#012438",
                      borderColor: brand ? BRAND_COLORS[brand] : "#012438",
                      color: "#fff",
                    }
                  : {
                      borderColor: "#e5e7eb",
                      color: "#6b7280",
                      backgroundColor: "#fff",
                    }
              }
            >
              {brand || "Todas"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          icon={LuBanknote}
          label="Ingresos"
          value={formatCurrency(income)}
          color="#16a34a"
        />

        <button
          onClick={() => onNavigate && onNavigate("ingresos")}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer text-left group"
        >
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <LuWallet size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-accent uppercase">
              Cuentas x Cobrar
            </p>
            <p className="text-xl font-black text-primary truncate">
              {formatCurrency(pendingAccountsSummary.totalPending)}
            </p>
            <p className="text-[11px] text-accent truncate">
              {pendingAccountsSummary.count} pendiente
              {pendingAccountsSummary.count !== 1 ? "s" : ""}
            </p>
          </div>
        </button>

        <StatCard
          icon={LuUsers}
          label="Clientes atendidos"
          value={summary.clientsAttended}
          color="#197e88"
        />
        <StatCard
          icon={LuUserPlus}
          label="Clientes nuevos"
          value={summary.newClients}
          color="#c0247d"
        />
        <StatCard
          icon={LuCalendarCheck}
          label="Citas totales"
          value={summary.totalAppointments}
          color="#c99a4a"
        />
      </div>

      {/* Gráfica de ingresos por día */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-primary uppercase">
            Ingresos por Día
          </h3>
          {!marca && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS["Modelha DK"] }}
                />
                Modelha DK
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS["Depilclinik"] }}
                />
                Depilclinik
              </span>
            </div>
          )}
        </div>

        {dailyIncome.every(
          (d) => (d["Modelha DK"] || 0) + (d["Depilclinik"] || 0) === 0,
        ) ? (
          <p className="text-xs text-accent text-center py-10">
            Sin ingresos registrados este mes.
          </p>
        ) : (
          (() => {
            const rawMax = Math.max(
              ...dailyIncome.map(
                (d) => (d["Modelha DK"] || 0) + (d["Depilclinik"] || 0),
              ),
              1,
            );
            // Escoge un tamaño de escalón razonable según la magnitud real de los
            // datos, para que siempre se vean ~5-8 líneas de referencia legibles.
            const chooseStep = (max) => {
              if (max <= 10000) return 1000;
              if (max <= 20000) return 2000;
              if (max <= 30000) return 3000;
              if (max <= 50000) return 5000;
              return 10000;
            };
            const step = chooseStep(rawMax);
            const maxValue = Math.max(step, Math.ceil(rawMax / step) * step);
            const yTicks = [];
            for (let v = 0; v <= maxValue; v += step) yTicks.push(v);

            const formatTick = (v) =>
              v >= 1000
                ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
                : `$${v}`;

            const CHART_HEIGHT = 220;

            return (
              <div className="flex gap-2">
                <div
                  className="flex flex-col justify-between shrink-0 text-right w-12"
                  style={{ height: `${CHART_HEIGHT}px` }}
                >
                  {[...yTicks].reverse().map((tick) => (
                    <span
                      key={tick}
                      className="text-[10px] text-accent font-semibold leading-none"
                    >
                      {formatTick(tick)}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto overflow-y-visible flex-1">
                  <div style={{ minWidth: `${dailyIncome.length * 40}px` }}>
                    <div
                      className="relative"
                      style={{ height: `${CHART_HEIGHT}px` }}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        {yTicks.map((tick) => (
                          <div
                            key={tick}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ bottom: `${(tick / maxValue) * 100}%` }}
                          />
                        ))}
                      </div>

                      <div className="absolute inset-0 flex items-end gap-1.5">
                        {dailyIncome.map((d) => {
                          const modelha = d["Modelha DK"] || 0;
                          const depil = d["Depilclinik"] || 0;
                          const showModelha = !marca || marca === "Modelha DK";
                          const showDepil = !marca || marca === "Depilclinik";
                          const total =
                            (showModelha ? modelha : 0) +
                            (showDepil ? depil : 0);

                          return (
                            <div
                              key={d.date}
                              className="flex-1 h-full flex flex-col justify-end relative"
                            >
                              {total > 0 && (
                                <div
                                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap"
                                  style={{ color: "#012438" }}
                                >
                                  {formatCurrency(total)}
                                </div>
                              )}
                              <div className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end h-full bg-gray-50/50">
                                {showDepil && depil > 0 && (
                                  <div
                                    style={{
                                      height: `${Math.max((depil / maxValue) * 100, 1.5)}%`,
                                      backgroundColor: BRAND_COLORS.Depilclinik,
                                    }}
                                  />
                                )}
                                {showModelha && modelha > 0 && (
                                  <div
                                    style={{
                                      height: `${Math.max((modelha / maxValue) * 100, 1.5)}%`,
                                      backgroundColor:
                                        BRAND_COLORS["Modelha DK"],
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-1.5">
                      {dailyIncome.map((d) => (
                        <span
                          key={d.date}
                          className="flex-1 text-center text-[10px] text-accent font-semibold"
                        >
                          {formatDayLabel(d.date)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
            <LuTrophy size={16} className="text-secondary" /> Rendimiento de
            Colaboradores
          </h3>
          {performance.length === 0 ? (
            <p className="text-xs text-accent text-center py-6">
              Aún no hay servicios completados en este periodo.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {performance.map((p, index) => {
                const medalStyles = [
                  { bg: "#fef3c7", text: "#b45309", ring: "#f59e0b" }, // oro
                  { bg: "#f1f5f9", text: "#475569", ring: "#94a3b8" }, // plata
                  { bg: "#fed7aa", text: "#9a3412", ring: "#ea580c" }, // bronce
                ];
                const medal = medalStyles[index];
                const initials = p.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={p.userId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="w-5 text-xs font-bold text-gray-400 shrink-0 text-center">
                      {index + 1}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={
                        medal
                          ? {
                              backgroundColor: medal.bg,
                              color: medal.text,
                              boxShadow: `0 0 0 2px ${medal.ring}`,
                            }
                          : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {initials}
                    </div>
                    <span className="flex-1 min-w-0 text-sm font-semibold text-primary truncate">
                      {formatShortName(p.name)}
                    </span>
                    <span className="text-sm font-black text-primary shrink-0">
                      {p.count}
                      <span className="text-[10px] font-semibold text-accent ml-1">
                        servicios
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase mb-4">
            Tratamientos más vendidos
          </h3>
          {topTreatments.length === 0 ? (
            <p className="text-xs text-accent text-center py-6">
              Sin datos suficientes en este periodo.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topTreatments.map((t, index) => (
                <div key={t.serviceId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary truncate">
                      {t.name}
                    </p>
                    <span
                      className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${BRAND_COLORS[t.brand]}15`,
                        color: BRAND_COLORS[t.brand],
                      }}
                    >
                      {t.brand}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
          <LuClock size={16} className="text-secondary" /> Próximas Citas
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-accent text-center py-6">
            No hay citas próximas pendientes.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {BUCKET_ORDER.filter(
              (bucket) => groupedUpcoming[bucket]?.length,
            ).map((bucket) => (
              <div key={bucket}>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold mb-2 ${BUCKET_COLORS[bucket]}`}
                >
                  {bucket}
                </span>
                <div className="overflow-x-auto">
                  <div className="min-w-150">
                    <div className="grid grid-cols-[1.6fr_1.6fr_1.6fr_1fr_auto] gap-2 border-b border-gray-100 pb-2">
                      <span className="p-3 text-xs font-bold text-accent">
                        Cliente
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Servicio
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Colaborador
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Horario
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Expediente
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {groupedUpcoming[bucket].map((appt) => {
                        const hasAssessment =
                          appt.marca === "Modelha DK"
                            ? Boolean(appt.medicalAssessment)
                            : Boolean(appt.laserAssessment);
                        return (
                          <div
                            key={appt.appointmentId}
                            className="grid grid-cols-[1.6fr_1.6fr_1.6fr_1fr_auto] gap-2 items-center hover:bg-gray-50/50 transition-colors"
                          >
                            <span className="p-3 text-sm font-semibold text-primary">
                              {formatShortName(appt.customer?.name)}
                            </span>
                            <span className="p-3 text-sm text-gray-600">
                              {appt.service?.name || "—"}
                            </span>
                            <span className="p-3 text-sm text-gray-600">
                              {formatShortName(appt.collaborator?.name)}
                            </span>
                            <span className="p-3 text-sm text-gray-600">
                              {formatTime(appt.startTime)}
                            </span>
                            <span className="p-3">
                              {!hasAssessment && onAttendAppointment && (
                                <button
                                  onClick={() =>
                                    onAttendAppointment(appt.appointmentId)
                                  }
                                  className="text-[11px] font-bold text-white bg-secondary hover:bg-[#14676f] transition-colors px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap"
                                >
                                  Llenar
                                </button>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
