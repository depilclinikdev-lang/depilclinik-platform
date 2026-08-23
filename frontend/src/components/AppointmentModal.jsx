import React, { useState, useEffect } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import api from "../services/api";
import ConflictOverrideModal from "./ConflictOverrideModal";
import CustomerAutocomplete from "./CustomerAutocomplete";
import CheckoutModal from "./CheckoutModal";
import { WheelDropdown, TimeWheelDropdown } from "./DateTimePickers";
import {
  APPOINTMENT_STATUSES,
  STATUS_META,
} from "../constants/appointmentStatus";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";
import { useBackButtonClose } from "../hooks/useBackButtonClose";

const initialFormState = {
  marca: "Modelha DK",
  serviceId: "",
  userId: "",
  startTime: "",
  endTime: "",
  status: "Programada",
};

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1),
}));

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - 1 + i;
  return { value: String(y), label: String(y) };
});

const getTodayParts = () => {
  const now = new Date();
  return {
    day: String(now.getDate()).padStart(2, "0"),
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
  };
};

const toDatetimeLocalValue = (isoString) => {
  const date = new Date(isoString);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const parseDateTimeLocal = (value) => {
  if (!value) return { date: getTodayParts(), time: "" };
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  return { date: { day, month, year }, time: (timePart || "").slice(0, 5) };
};

const buildDateTimeLocal = (dateParts, time) => {
  const { day, month, year } = dateParts;
  if (!day || !month || !year || !time) return "";
  return `${year}-${month}-${day}T${time}`;
};

const AppointmentModal = ({ isOpen, onClose, onRefresh, appointment }) => {
  const isEditMode = Boolean(appointment);

  const [formData, setFormData] = useState(initialFormState);
  const [dateParts, setDateParts] = useState(getTodayParts());
  const [startHourMin, setStartHourMin] = useState("");
  const [endHourMin, setEndHourMin] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveConflict, setLiveConflict] = useState(null);
  const [conflictToConfirm, setConflictToConfirm] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setLiveConflict(null);
      setShowOverrideModal(false);

      if (isEditMode) {
        setFormData({
          marca: appointment.marca,
          serviceId: String(
            appointment.service?.serviceId || appointment.serviceId || "",
          ),
          userId: appointment.collaborator?.id
            ? String(appointment.collaborator.id)
            : appointment.userId
              ? String(appointment.userId)
              : "",
          startTime: toDatetimeLocalValue(appointment.startTime),
          endTime: toDatetimeLocalValue(appointment.endTime),
          status: appointment.status,
        });

        const startParsed = parseDateTimeLocal(
          toDatetimeLocalValue(appointment.startTime),
        );
        const endParsed = parseDateTimeLocal(
          toDatetimeLocalValue(appointment.endTime),
        );
        setDateParts(startParsed.date);
        setStartHourMin(startParsed.time);
        setEndHourMin(endParsed.time);

        setSelectedCustomer(
          appointment.customer
            ? {
                customerId: appointment.customer.customerId,
                name: appointment.customer.name,
                phone: appointment.customer.phone,
              }
            : null,
        );
      } else {
        setFormData(initialFormState);
        setDateParts(getTodayParts());
        setStartHourMin("");
        setEndHourMin("");
        setSelectedCustomer(null);
      }

      fetchCollaborators();
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (isOpen) {
      fetchServicesByBrand(formData.marca);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.marca, isOpen]);

  useEffect(() => {
    const value = buildDateTimeLocal(dateParts, startHourMin);
    setFormData((prev) =>
      prev.startTime === value ? prev : { ...prev, startTime: value },
    );
  }, [dateParts, startHourMin]);

  useEffect(() => {
    const value = buildDateTimeLocal(dateParts, endHourMin);
    setFormData((prev) =>
      prev.endTime === value ? prev : { ...prev, endTime: value },
    );
  }, [dateParts, endHourMin]);

  useEffect(() => {
    if (!formData.userId || !formData.startTime || !formData.endTime) {
      setLiveConflict(null);
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setLiveConflict(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get("/appointments/check-conflict", {
          params: {
            userId: formData.userId,
            startTime: formData.startTime,
            endTime: formData.endTime,
            excludeId: isEditMode ? appointment.appointmentId : undefined,
          },
        });
        setLiveConflict(
          response.data.hasConflict ? response.data.conflict : null,
        );
      } catch (err) {
        console.error(err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    formData.userId,
    formData.startTime,
    formData.endTime,
    isEditMode,
    appointment,
  ]);

  const fetchCollaborators = async () => {
    try {
      const usersRes = await api.get("/auth/usuarios");
      setCollaborators(usersRes.data.filter((u) => u.is_active));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServicesByBrand = async (brand) => {
    try {
      const response = await api.get(
        `/services?brand=${encodeURIComponent(brand)}`,
      );
      setServices(response.data);
    } catch (err) {
      console.error(err);
    }
  };
  useBackButtonClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildPayload = (force) => ({
    customerId: selectedCustomer ? Number(selectedCustomer.customerId) : null,
    serviceId: Number(formData.serviceId),
    userId: formData.userId ? Number(formData.userId) : null,
    marca: formData.marca,
    startTime: formData.startTime,
    endTime: formData.endTime,
    force,
  });

  const submitAppointment = async (force = false) => {
    if (!selectedCustomer) {
      setError("Selecciona o registra un cliente para continuar");
      return;
    }

    if (!formData.serviceId) {
      setError("Selecciona un servicio para continuar");
      return;
    }

    if (!formData.userId) {
      setError("Selecciona un colaborador para continuar");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError("Completa la fecha y la hora de inicio y fin");
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      setError("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    setLoading(true);
    setError("");
    showLoading(isEditMode ? "Guardando cita..." : "Agendando cita...");

    try {
      let updatedAppointment = appointment;

      if (isEditMode) {
        const putResponse = await api.put(
          `/appointments/${appointment.appointmentId}`,
          buildPayload(force),
        );
        updatedAppointment = putResponse.data;

        const isNowCompleting =
          formData.status === "Completada" &&
          appointment.status !== "Completada";

        if (formData.status !== appointment.status) {
          const statusResponse = await api.patch(
            `/appointments/${appointment.appointmentId}/status`,
            { status: formData.status },
          );
          updatedAppointment = {
            ...updatedAppointment,
            status: statusResponse.data.status,
          };
        }

        if (isNowCompleting && !appointment?.packageSession) {
          closeAlert();
          setPendingCheckoutData({
            appointmentId: appointment.appointmentId,
            customer: selectedCustomer,
            marca: formData.marca,
            service: services.find(
              (s) => s.serviceId === Number(formData.serviceId),
            ),
          });
          setShowCheckoutModal(true);
          setLoading(false);
          return;
        }
      } else {
        await api.post("/appointments", buildPayload(force));
      }

      closeAlert();
      showSuccess(isEditMode ? "Cita actualizada" : "Cita agendada");
      onRefresh();
      onClose();
    } catch (err) {
      closeAlert();
      if (err.response?.status === 409) {
        setConflictToConfirm(err.response.data.conflict);
        setShowOverrideModal(true);
      } else {
        const msg =
          err.response?.data?.message ||
          `Error al ${isEditMode ? "actualizar" : "agendar"} la cita`;
        setError(msg);
        showError("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitAppointment(false);
  };

  const handleForceOverride = async () => {
    await submitAppointment(true);
    setShowOverrideModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <h2 className="text-lg font-bold text-primary">
            {isEditMode ? "Editar Cita" : "Nueva Cita"}
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
              {error}
            </p>
          )}

          {isEditMode && (
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Estado
              </label>
              <WheelDropdown
                label=""
                value={formData.status}
                options={APPOINTMENT_STATUSES.map((status) => ({
                  value: status,
                  label: STATUS_META[status].label,
                  color: STATUS_META[status].color,
                }))}
                onChange={(status) =>
                  setFormData((prev) => ({ ...prev, status }))
                }
                renderValue={(opt) => (
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-primary font-semibold truncate">
                      {opt.label}
                    </span>
                  </span>
                )}
                renderOption={(opt, isSelected) => (
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: isSelected ? "#fff" : opt.color,
                      }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </span>
                )}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Marca *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Modelha DK", "Depilclinik"].map((brand) => (
                <button
                  type="button"
                  key={brand}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      marca: brand,
                      serviceId: "",
                    }))
                  }
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    formData.marca === brand
                      ? "bg-secondary text-white border-secondary"
                      : "border-borderClinik text-primary hover:bg-gray-50"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Cliente *
            </label>
            <CustomerAutocomplete
              value={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Servicio *
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none focus:border-secondary bg-white"
            >
              <option value="">
                Selecciona un servicio de {formData.marca}
              </option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Colaborador *
            </label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none focus:border-secondary bg-white"
            >
              <option value="">Selecciona un colaborador</option>
              {collaborators.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl border border-borderClinik bg-gray-50/50 flex flex-col gap-3">
            <span className="text-xs font-black text-primary uppercase tracking-wide">
              Fecha de la Cita *
            </span>
            <div className="grid grid-cols-3 gap-2">
              <WheelDropdown
                label="Día"
                value={dateParts.day}
                options={DAYS}
                onChange={(v) => setDateParts((prev) => ({ ...prev, day: v }))}
              />
              <WheelDropdown
                label="Mes"
                value={dateParts.month}
                options={MONTHS}
                onChange={(v) =>
                  setDateParts((prev) => ({ ...prev, month: v }))
                }
              />
              <WheelDropdown
                label="Año"
                value={dateParts.year}
                options={YEARS}
                onChange={(v) => setDateParts((prev) => ({ ...prev, year: v }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimeWheelDropdown
                label="Hora de Inicio *"
                value={startHourMin}
                onChange={setStartHourMin}
              />
              <TimeWheelDropdown
                label="Hora de Fin *"
                value={endHourMin}
                onChange={setEndHourMin}
              />
            </div>
          </div>

          {liveConflict && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <LuTriangleAlert size={16} className="shrink-0 mt-0.5" />
              <span>
                Este colaborador ya tiene la cita de{" "}
                <strong>{liveConflict.customer?.name || "otro cliente"}</strong>{" "}
                en un horario que se cruza. Podrás forzar la reserva al guardar.
              </span>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-2 bg-gray-50/70 -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-borderClinik rounded-full text-xs font-semibold text-primary hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : isEditMode
                  ? "Guardar Cambios"
                  : "Agendar Cita"}
            </button>
          </div>
        </form>
      </div>

      <ConflictOverrideModal
        isOpen={showOverrideModal}
        conflict={conflictToConfirm}
        onCancel={() => setShowOverrideModal(false)}
        onForce={handleForceOverride}
        loading={loading}
      />
      <CheckoutModal
        isOpen={showCheckoutModal}
        appointment={pendingCheckoutData}
        onClose={() => {
          setShowCheckoutModal(false);
          onRefresh();
          onClose();
        }}
        onCompleted={() => {
          setShowCheckoutModal(false);
          onRefresh();
          onClose();
        }}
        onSkip={() => {
          setShowCheckoutModal(false);
          onRefresh();
          onClose();
        }}
      />
    </div>
  );
};

export default AppointmentModal;
