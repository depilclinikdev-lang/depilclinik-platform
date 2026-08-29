import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LuCalendarCheck,
  LuClipboardCheck,
  LuClock,
  LuCalendarDays,
  LuSparkles,
  LuChevronRight,
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

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

const CollaboratorDashboard = ({
  userName,
  onNavigate,
  onAttendAppointment,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [myTopTreatments, setMyTopTreatments] = useState([]);

  const formatTime = (value) =>
    new Date(value).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const fetchAll = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [todayRes, countRes, upcomingRes, topTreatmentsRes] =
        await Promise.all([
          api.get("/dashboard/my-today-appointments"),
          api.get("/dashboard/my-monthly-count"),
          api.get("/dashboard/my-upcoming-appointments"),
          api.get("/dashboard/my-top-treatments"),
        ]);

      setTodayAppointments(todayRes.data);
      setMonthlyCount(countRes.data.completedCount);
      setUpcoming(upcomingRes.data || []);
      setMyTopTreatments(topTreatmentsRes.data || []);
      setError("");
    } catch (err) {
      setError("No se pudo cargar tu información del día.");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, []);

  const groupedUpcoming = upcoming.reduce((acc, appt) => {
    const bucket = getDayBucket(appt.startTime || appt.start_time);
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(appt);
    return acc;
  }, {});

  if (loading) {
    return (
      <p className="text-secondary text-center font-medium p-8 text-sm">
        Cargando tu panel...
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
            {getGreeting()}, {userName?.split(" ")[0] || "colaborador"}
            <span className="text-3xl">👋</span>
          </p>
          <p className="text-sm text-white/80 mt-0.5">
            Aquí tienes el resumen de tu día.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={LuCalendarCheck}
          label="Citas para hoy"
          value={todayAppointments.length}
          color="#197e88"
        />
        <StatCard
          icon={LuClipboardCheck}
          label="Servicios completados (mes)"
          value={monthlyCount}
          color="#16a34a"
        />
        {onNavigate && (
          <button
            onClick={() => onNavigate("agenda")}
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:border-secondary hover:shadow-md hover:bg-secondary/5 transition-all cursor-pointer text-left"
          >
            <div className="w-11 h-11 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary group-hover:text-white transition-colors">
              <LuCalendarDays size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">Ir a mi Agenda</p>
            </div>
            <LuChevronRight
              size={16}
              className="text-gray-300 group-hover:text-secondary group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
          <LuClock size={16} className="text-secondary" /> Tus Próximas Citas
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-accent text-center py-6">
            No tienes próximas citas pendientes.
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
                  <div className="min-w-125">
                    <div className="grid grid-cols-[2fr_2fr_1.2fr_auto] gap-2 border-b border-gray-100 pb-2">
                      <span className="p-3 text-xs font-bold text-accent">
                        Cliente
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Servicio
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
                            className="grid grid-cols-[2fr_2fr_1.2fr_auto] gap-2 items-center hover:bg-gray-50/50 transition-colors"
                          >
                            <span className="p-3 text-sm font-semibold text-primary">
                              {appt.customer?.name || "—"}
                            </span>
                            <span className="p-3 text-sm text-gray-600">
                              {appt.service?.name || "—"}
                            </span>
                            <span className="p-3 text-sm text-gray-600">
                              {formatTime(appt.startTime || appt.start_time)}
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

      {myTopTreatments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary uppercase mb-4">
            Mis Tratamientos Más Realizados (mes)
          </h3>
          <div className="flex flex-col gap-3">
            {myTopTreatments.map((t, index) => (
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
        </div>
      )}
    </div>
  );
};

export default CollaboratorDashboard;
