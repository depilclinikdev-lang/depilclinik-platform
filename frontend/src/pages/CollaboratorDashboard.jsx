import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LuCalendarCheck,
  LuClipboardCheck,
  LuClock,
  LuTriangleAlert,
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

const CollaboratorDashboard = ({ userName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [pendingAssessments, setPendingAssessments] = useState([]);

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
      const [todayRes, countRes, upcomingRes, pendingRes] = await Promise.all([
        api.get("/dashboard/my-today-appointments"),
        api.get("/dashboard/my-monthly-count"),
        api.get("/dashboard/my-upcoming-appointments"),
        api.get("/dashboard/my-pending-assessments"),
      ]);

      setTodayAppointments(todayRes.data);
      setMonthlyCount(countRes.data.completedCount);
      setUpcoming(upcomingRes.data || []);
      setPendingAssessments(pendingRes.data);
      setError("");
    } catch (err) {
      setError("No se pudo cargar tu información del día.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
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
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold mb-2 bg-blue-50 text-secondary border border-blue-100">
          Dashboard Colaborador
        </span>
        <p className="text-lg font-bold text-primary">
          Hola, {userName?.split(" ")[0] || "colaborador"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <div className="grid grid-cols-[2fr_2fr_1.2fr] gap-2 border-b border-gray-100 pb-2">
                      <span className="p-3 text-xs font-bold text-accent">
                        Cliente
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Servicio
                      </span>
                      <span className="p-3 text-xs font-bold text-accent">
                        Horario
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {groupedUpcoming[bucket].map((appt) => (
                        <div
                          key={appt.appointmentId}
                          className="grid grid-cols-[2fr_2fr_1.2fr] gap-2 hover:bg-gray-50/50 transition-colors"
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

      {pendingAssessments.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-amber-800 uppercase mb-4 flex items-center gap-2">
            <LuTriangleAlert size={16} /> Expedientes Pendientes de Llenar
          </h3>
          <div className="flex flex-col gap-2">
            {pendingAssessments.map((appt) => (
              <div
                key={appt.appointmentId}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {appt.customer?.name || "—"}
                  </p>
                  <p className="text-xs text-accent">
                    {appt.service?.name} · {appt.service?.brand}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  Pendiente
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
