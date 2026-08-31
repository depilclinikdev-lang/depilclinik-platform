import { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import es from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { LuPlus, LuFileText } from "react-icons/lu";
import api from "../services/api";
import AppointmentModal from "../components/AppointmentModal";
import AppointmentDetailsModal from "../components/AppointmentDetailsModal";
import { STATUS_META } from "../constants/appointmentStatus";
import CheckoutModal from "../components/CheckoutModal";
import PackageDetailModal from "../components/PackageDetailModal";
import { showLoading, closeAlert, showError } from "../utils/alerts";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
});

const BRAND_COLORS = {
  "Modelha DK": "#197e88",
  Depilclinik: "#c026d3",
};

const MONTH_ACCENTS = [
  "#5b7fa6",
  "#c0247d",
  "#7a9e7e",
  "#9b7fb8",
  "#e8746a",
  "#197e88",
  "#c99a4a",
  "#c1694a",
  "#8a5a7a",
  "#b8622f",
  "#4a5a8a",
  "#2f7a5e",
];

// Parsea una fecha tipo DATEONLY ("2026-07-15") como fecha local pura,
// sin desfases de zona horaria — igual que ya hicimos en el historial de
// expedientes.
const parseDateOnly = (value) => {
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const Agenda = ({ currentUserRole, onAttendAppointment }) => {
  const [appointments, setAppointments] = useState([]);
  const [historicalAssessments, setHistoricalAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [viewingHistorical, setViewingHistorical] = useState(null);
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewingPackage, setViewingPackage] = useState(null);
  const [directCheckoutAppointment, setDirectCheckoutAppointment] =
    useState(null);

  const isAdmin = currentUserRole === "Administrador";

  const monthAccent = useMemo(
    () => MONTH_ACCENTS[currentDate.getMonth()],
    [currentDate],
  );

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [api.get("/appointments")];

      // Los expedientes históricos (sin cita) solo aplican para
      // Administrador — solo el admin registra este tipo de expediente.
      if (isAdmin) {
        requests.push(
          api.get("/assessments/historical/calendar"),
          api.get("/laser-assessments/historical/calendar"),
        );
      }

      const [apptRes, modelhaHistRes, laserHistRes] =
        await Promise.all(requests);

      setAppointments(apptRes.data);

      if (isAdmin) {
        const combined = [
          ...(modelhaHistRes?.data || []).map((a) => ({
            ...a,
            idKey: `modelha-${a.assessmentId}`,
            brand: "Modelha DK",
          })),
          ...(laserHistRes?.data || []).map((a) => ({
            ...a,
            idKey: `laser-${a.laserAssessmentId}`,
            brand: "Depilclinik",
          })),
        ];
        setHistoricalAssessments(combined);
      }

      setError("");
    } catch (err) {
      setError("No se pudo conectar con la agenda.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const events = useMemo(() => {
    const appointmentEvents = appointments
      .filter((appt) => appt.startTime && appt.endTime)
      .map((appt) => {
        const needsCheckout =
          isAdmin &&
          appt.status === "Completada" &&
          !appt.sale &&
          !appt.packageSession;
        return {
          id: appt.appointmentId,
          type: "appointment",
          title: `${needsCheckout ? "💲 " : ""}${appt.customer?.name || "Cliente"} · ${appt.service?.name || ""}`,
          start: new Date(appt.startTime),
          end: new Date(appt.endTime),
          marca: appt.marca,
          status: appt.status,
          needsCheckout,
          resource: appt,
        };
      });

    // Expedientes históricos: eventos de día completo, sin hora, con un
    // ícono de expediente para diferenciarlos claramente de una cita real.
    const historicalEvents = historicalAssessments.map((item) => {
      const day = parseDateOnly(item.serviceDate);
      return {
        id: item.idKey,
        type: "historical",
        title: `📋 ${item.customer?.name || "Cliente"} · ${item.service?.name || "Registro histórico"}`,
        start: day,
        end: day,
        allDay: true,
        marca: item.brand,
        resource: item,
      };
    });

    return [...appointmentEvents, ...historicalEvents];
  }, [appointments, historicalAssessments, isAdmin]);

  const eventPropGetter = useCallback((event) => {
    if (event.type === "historical") {
      const brandColor = BRAND_COLORS[event.marca] || "#5b9fa6";
      return {
        style: {
          backgroundColor: "#f3f4f6",
          color: "#374151",
          border: `1.5px dashed ${brandColor}`,
          fontStyle: "italic",
        },
      };
    }

    const statusColor = STATUS_META[event.status]?.color || "#5b9fa6";
    const brandColor = BRAND_COLORS[event.marca] || "#5b9fa6";
    return {
      style: {
        backgroundColor: `color-mix(in srgb, ${statusColor} 55%, white)`,
        color: "#1f2937",
        borderLeft: `6px solid ${event.needsCheckout ? "#dc2626" : brandColor}`,
        opacity: event.status === "Cancelada" ? 0.45 : 1,
        textDecoration: event.status === "Cancelada" ? "line-through" : "none",
        boxShadow: event.needsCheckout ? "0 0 0 2px #dc2626 inset" : "none",
      },
    };
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  }, []);

  const handleEditAppointment = useCallback(async (appointment) => {
    setViewingAppointment(null);

    if (appointment.packageSession?.packageId) {
      try {
        showLoading("Cargando paquete...");
        const response = await api.get(
          `/packages/${appointment.packageSession.packageId}`,
        );
        closeAlert();
        setViewingPackage(response.data);
      } catch (err) {
        closeAlert();
        showError("Error", "No se pudo cargar el paquete de esta cita");
        console.error(err);
      }
      return;
    }

    setEditingAppointment(appointment);
    setIsModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback(
    (event) => {
      if (event.type === "historical") {
        setViewingHistorical(event.resource);
        return;
      }
      if (event.needsCheckout && isAdmin) {
        setDirectCheckoutAppointment({
          appointmentId: event.resource.appointmentId,
          customer: event.resource.customer,
          marca: event.resource.marca,
          service: event.resource.service,
        });
        return;
      }
      setViewingAppointment(event.resource);
    },
    [isAdmin],
  );

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-primary">
          <span className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: BRAND_COLORS["Modelha DK"] }}
            />
            Modelha DK
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: BRAND_COLORS["Depilclinik"] }}
            />
            Depilclinik
          </span>
          {isAdmin && (
            <span className="flex items-center gap-2 text-accent font-normal">
              <span className="w-3.5 h-3.5 rounded border border-dashed border-gray-400 bg-gray-100" />
              Registro histórico (sin cita)
            </span>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md self-start sm:self-center"
          >
            <LuPlus size={14} /> Nueva Cita
          </button>
        )}
      </div>

      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 month-themed-calendar"
        style={{ "--month-accent": monthAccent }}
      >
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando agenda...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center font-medium p-8 text-sm">
            {error}
          </p>
        ) : (
          <div style={{ height: 650 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              eventPropGetter={eventPropGetter}
              onSelectEvent={handleSelectEvent}
              components={{
                event: ({ title }) => (
                  <span className="rbc-event-title-only">{title}</span>
                ),
              }}
              messages={{
                next: "Sig.",
                previous: "Ant.",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                noEventsInRange: "No hay citas en este rango.",
              }}
            />
          </div>
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchAppointments}
        appointment={editingAppointment}
      />

      <AppointmentDetailsModal
        isOpen={Boolean(viewingAppointment)}
        appointment={viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        onAttend={(appointmentId) => {
          setViewingAppointment(null);
          onAttendAppointment(appointmentId);
        }}
        onEdit={isAdmin ? handleEditAppointment : undefined}
        onDeleted={fetchAppointments}
        isAdmin={isAdmin}
      />

      <CheckoutModal
        isOpen={Boolean(directCheckoutAppointment)}
        appointment={directCheckoutAppointment}
        onClose={() => {
          setDirectCheckoutAppointment(null);
          fetchAppointments();
        }}
        onCompleted={() => {
          setDirectCheckoutAppointment(null);
          fetchAppointments();
        }}
        onSkip={() => setDirectCheckoutAppointment(null)}
      />

      <PackageDetailModal
        isOpen={Boolean(viewingPackage)}
        pkg={viewingPackage}
        onClose={() => setViewingPackage(null)}
        onRefresh={async () => {
          await fetchAppointments();
          if (viewingPackage) {
            const response = await api.get(
              `/packages/${viewingPackage.packageId}`,
            );
            setViewingPackage(response.data);
          }
        }}
      />

      {viewingHistorical && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-left">
            <div className="flex items-center gap-2 mb-4">
              <LuFileText size={20} className="text-secondary" />
              <h2 className="text-lg font-bold text-primary">
                Registro Histórico
              </h2>
            </div>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <span className="block text-xs font-bold text-accent uppercase mb-0.5">
                  Cliente
                </span>
                <span className="text-sm font-semibold text-primary">
                  {viewingHistorical.customer?.name || "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-accent uppercase mb-0.5">
                  Servicio
                </span>
                <span className="text-sm font-semibold text-primary">
                  {viewingHistorical.service?.name || "—"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-accent uppercase mb-0.5">
                  Marca
                </span>
                <span className="text-sm font-semibold text-primary">
                  {viewingHistorical.brand}
                </span>
              </div>
            </div>
            <p className="text-xs text-accent bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 mb-4">
              Este registro se capturó manualmente, sin una cita agendada. Para
              editarlo, ve al expediente del cliente en el Directorio de
              Clientes.
            </p>
            <button
              onClick={() => setViewingHistorical(null)}
              className="w-full px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
