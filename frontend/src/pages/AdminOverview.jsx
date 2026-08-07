import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LuBanknote,
  LuUsers,
  LuUserPlus,
  LuCalendarCheck,
  LuTrophy,
  LuClock,
} from "react-icons/lu";

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
// (sin horas), para poder agrupar visualmente la tabla de próximas citas.
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

const AdminOverview = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [todaySummary, setTodaySummary] = useState({
    totalAppointmentsToday: 0,
    clientsAttendedToday: 0,
    newClientsToday: 0,
  });
  const [todayIncome, setTodayIncome] = useState(0);
  const [topTreatments, setTopTreatments] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  const formatShortName = (fullName) => {
    if (!fullName) return "—";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
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

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [
        summaryRes,
        incomeRes,
        treatmentsRes,
        performanceRes,
        upcomingRes,
      ] = await Promise.all([
        api.get("/dashboard/today-summary"),
        api.get("/sales/today-income"),
        api.get("/dashboard/top-treatments"),
        api.get("/dashboard/collaborator-performance"),
        api.get("/dashboard/upcoming-appointments"),
      ]);

      setTodaySummary(summaryRes.data);
      setTodayIncome(incomeRes.data.totalIncome);
      setTopTreatments(treatmentsRes.data);
      setPerformance(performanceRes.data);
      setUpcoming(upcomingRes.data);

      setError("");
    } catch (err) {
      setError("No se pudo cargar la información del dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={LuBanknote}
          label="Ingresos"
          value={formatCurrency(todayIncome)}
          color="#16a34a"
        />
        <StatCard
          icon={LuUsers}
          label="Clientes atendidos"
          value={todaySummary.clientsAttendedToday}
          color="#197e88"
        />
        <StatCard
          icon={LuUserPlus}
          label="Clientes nuevos"
          value={todaySummary.newClientsToday}
          color="#c0247d"
        />
        <StatCard
          icon={LuCalendarCheck}
          label="Citas totales"
          value={todaySummary.totalAppointmentsToday}
          color="#c99a4a"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
            <LuTrophy size={16} className="text-secondary" /> Rendimiento de
            Colaboradores (mes)
          </h3>
          {performance.length === 0 ? (
            <p className="text-xs text-accent text-center py-6">
              Aún no hay servicios completados este mes.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {performance.map((p) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-primary min-w-32 shrink-0">
                    {formatShortName(p.name)}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-secondary to-depil rounded-full transition-all"
                      style={{
                        width: `${(p.count / maxPerformanceCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary w-6 text-right">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase mb-4">
            Tratamientos más vendidos
          </h3>
          {topTreatments.length === 0 ? (
            <p className="text-xs text-accent text-center py-6">
              Sin datos suficientes este mes.
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
                    <p className="text-[11px] text-accent">{t.brand}</p>
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
                    <div className="grid grid-cols-[1.8fr_1.8fr_1.8fr_1.2fr] gap-2 border-b border-gray-100 pb-2">
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
                    </div>
                    <div className="divide-y divide-gray-100">
                      {groupedUpcoming[bucket].map((appt) => (
                        <div
                          key={appt.appointmentId}
                          className="grid grid-cols-[1.8fr_1.8fr_1.8fr_1.2fr] gap-2 hover:bg-gray-50/50 transition-colors"
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
                        </div>
                      ))}
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
