import React, { useState } from "react";
import {
  LuX,
  LuCalendarPlus,
  LuWallet,
  LuCheck,
  LuClock,
} from "react-icons/lu";
import api from "../services/api";
import { WheelDropdown, TimeWheelDropdown } from "./DateTimePickers";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";
import { useBackButtonClose } from "../hooks/useBackButtonClose";

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
const YEARS = Array.from({ length: 3 }, (_, i) => ({
  value: String(CURRENT_YEAR + i),
  label: String(CURRENT_YEAR + i),
}));

const PackageDetailModal = ({
  isOpen,
  pkg,
  onClose,
  onRefresh,
  onViewResults,
}) => {
  const [scheduling, setScheduling] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [userId, setUserId] = useState("");
  const [dateParts, setDateParts] = useState({
    day: "",
    month: "",
    year: String(CURRENT_YEAR),
  });
  const [startHourMin, setStartHourMin] = useState("");
  const [endHourMin, setEndHourMin] = useState("");
  const [amount, setAmount] = useState("");
  const [showPay, setShowPay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editUserId, setEditUserId] = useState("");
  const [editDateParts, setEditDateParts] = useState({
    day: "",
    month: "",
    year: String(CURRENT_YEAR),
  });
  const [editStartHourMin, setEditStartHourMin] = useState("");
  const [editEndHourMin, setEditEndHourMin] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  useBackButtonClose(isOpen, onClose);

  React.useEffect(() => {
    if (isOpen) {
      api
        .get("/auth/usuarios")
        .then((res) => setCollaborators(res.data.filter((u) => u.is_active)));
      setScheduling(false);
      setShowPay(false);
      setAmount("");
      setEditingSession(null);
    }
  }, [isOpen]);

  if (!isOpen || !pkg) return null;

  const balance = parseFloat(pkg.totalPrice) - parseFloat(pkg.amountPaid);

  const handleScheduleNext = async () => {
    const { day, month, year } = dateParts;
    if (!day || !month || !year || !startHourMin || !endHourMin) {
      showError("Faltan datos", "Completa fecha y horario de inicio/fin");
      return;
    }
    const startTime = `${year}-${month}-${day}T${startHourMin}`;
    const endTime = `${year}-${month}-${day}T${endHourMin}`;

    setLoading(true);
    showLoading("Agendando sesión...");
    try {
      await api.post(`/packages/${pkg.packageId}/schedule-next`, {
        userId: userId || null,
        startTime,
        endTime,
      });
      closeAlert();
      showSuccess("Sesión agendada");
      setScheduling(false);
      onRefresh();
    } catch (err) {
      closeAlert();
      if (err.response?.status === 409) {
        showError("Conflicto de horario", err.response.data.message);
      } else {
        showError(
          "Error",
          err.response?.data?.message || "No se pudo agendar la sesión",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    showLoading("Registrando abono...");
    try {
      await api.post(`/packages/${pkg.packageId}/payments`, {
        amount: Number(amount),
      });
      closeAlert();
      showSuccess("Abono registrado");
      setShowPay(false);
      onRefresh();
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo registrar el abono",
      );
    } finally {
      setLoading(false);
    }
  };

  const nextPendingExists = pkg.sessions?.some((s) => s.status === "Pendiente");

  const openEditSession = (session) => {
    const appt = session.appointment;
    if (!appt) return;
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);

    setEditUserId(appt.userId ? String(appt.userId) : "");
    setEditDateParts({
      day: String(start.getDate()).padStart(2, "0"),
      month: String(start.getMonth() + 1).padStart(2, "0"),
      year: String(start.getFullYear()),
    });
    setEditStartHourMin(
      `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    );
    setEditEndHourMin(
      `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    );
    setEditingSession(session);
    setScheduling(false);
  };

  const handleSaveSessionEdit = async () => {
    const { day, month, year } = editDateParts;
    if (!day || !month || !year || !editStartHourMin || !editEndHourMin) {
      showError("Faltan datos", "Completa fecha y horario de inicio/fin");
      return;
    }
    const startTime = `${year}-${month}-${day}T${editStartHourMin}`;
    const endTime = `${year}-${month}-${day}T${editEndHourMin}`;

    setEditLoading(true);
    showLoading("Guardando cambios...");
    try {
      await api.put(
        `/appointments/${editingSession.appointment.appointmentId}`,
        {
          userId: editUserId ? Number(editUserId) : null,
          startTime,
          endTime,
        },
      );
      closeAlert();
      showSuccess("Cita actualizada");
      setEditingSession(null);
      onRefresh();
    } catch (err) {
      closeAlert();
      if (err.response?.status === 409) {
        showError("Conflicto de horario", err.response.data.message);
      } else {
        showError(
          "Error",
          err.response?.data?.message || "No se pudo actualizar la cita",
        );
      }
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {pkg.customer?.name}
            </h2>
            <p className="text-xs text-accent">
              {pkg.service?.name} · {pkg.marca}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary cursor-pointer"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4 bg-gray-50/70 rounded-xl p-4 border border-gray-100 text-center">
            <div>
              <p className="text-[11px] font-bold text-accent uppercase">
                Progreso
              </p>
              <p className="text-lg font-black text-primary">
                {pkg.sessionsCompleted}/{pkg.totalSessions}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-accent uppercase">
                Saldo
              </p>
              <p
                className={`text-lg font-black ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}
              >
                ${balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-accent uppercase">
                Estado
              </p>
              <p className="text-lg font-black text-primary">{pkg.status}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Sesiones{" "}
              {pkg.status === "Activo" && (
                <span className="normal-case font-medium text-accent">
                  · toca una sesión pendiente para agendarla, o una agendada
                  para editarla
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pkg.sessions?.map((s) => {
                const isPendingClickable =
                  s.status === "Pendiente" && pkg.status === "Activo";
                const isScheduledClickable =
                  s.status === "Agendada" && Boolean(s.appointment);
                const isClickable = isPendingClickable || isScheduledClickable;

                return (
                  <div
                    key={s.packageSessionId}
                    onClick={
                      isPendingClickable
                        ? () => {
                            setScheduling(true);
                            setEditingSession(null);
                            requestAnimationFrame(() => {
                              document
                                .getElementById("schedule-next-section")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "nearest",
                                });
                            });
                          }
                        : isScheduledClickable
                          ? () => {
                              openEditSession(s);
                              requestAnimationFrame(() => {
                                document
                                  .getElementById("edit-session-section")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest",
                                  });
                              });
                            }
                          : undefined
                    }
                    className={`border rounded-xl p-3 flex flex-col gap-1 transition-colors ${
                      isClickable
                        ? "border-secondary/30 bg-secondary/5 cursor-pointer hover:bg-secondary/10 hover:border-secondary"
                        : "border-gray-100"
                    }`}
                  >
                    <span className="text-xs font-bold text-primary">
                      Sesión {s.sessionNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        s.status === "Completada"
                          ? "text-emerald-600"
                          : s.status === "Agendada"
                            ? "text-secondary"
                            : s.status === "Cancelada"
                              ? "text-red-500"
                              : "text-amber-600"
                      }`}
                    >
                      {s.status === "Completada" ? (
                        <LuCheck size={12} />
                      ) : (
                        <LuClock size={12} />
                      )}{" "}
                      {s.status}
                    </span>
                    {s.appointment && (
                      <span className="text-[10px] text-accent">
                        {new Date(s.appointment.startTime).toLocaleString(
                          "es-MX",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {balance > 0 && (
            <div>
              {!showPay ? (
                <button
                  onClick={() => setShowPay(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs cursor-pointer"
                >
                  <LuWallet size={14} /> Registrar Abono
                </button>
              ) : (
                <div className="flex gap-2 items-end">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Máx: ${balance.toFixed(2)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-borderClinik text-sm"
                  />
                  <button
                    onClick={handleRegisterPayment}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          )}

          {pkg.status === "Completado" && onViewResults && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => onViewResults(pkg)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-xs cursor-pointer"
              >
                <LuCheck size={15} /> Ver Resultado del Paquete
              </button>
            </div>
          )}

          {pkg.status === "Activo" && nextPendingExists && (
            <div
              id="schedule-next-section"
              className="border-t border-gray-100 pt-4"
            >
              {!scheduling ? (
                <button
                  onClick={() => {
                    setScheduling(true);
                    setEditingSession(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-xs cursor-pointer"
                >
                  <LuCalendarPlus size={15} /> Agendar Siguiente Sesión
                </button>
              ) : (
                <div className="flex flex-col gap-3 bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white"
                  >
                    <option value="">Sin asignar</option>
                    {collaborators.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                        Día
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="2"
                        placeholder="DD"
                        value={dateParts.day}
                        onChange={(e) => {
                          const raw = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 2);
                          setDateParts((prev) => ({ ...prev, day: raw }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value.length === 1) {
                            setDateParts((prev) => ({
                              ...prev,
                              day: prev.day.padStart(2, "0"),
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                        Mes
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="2"
                        placeholder="MM"
                        value={dateParts.month}
                        onChange={(e) => {
                          const raw = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 2);
                          setDateParts((prev) => ({ ...prev, month: raw }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value.length === 1) {
                            setDateParts((prev) => ({
                              ...prev,
                              month: prev.month.padStart(2, "0"),
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <WheelDropdown
                      label="Año"
                      value={dateParts.year}
                      options={YEARS}
                      onChange={(v) =>
                        setDateParts((prev) => ({ ...prev, year: v }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeWheelDropdown
                      label="Hora inicio"
                      value={startHourMin}
                      onChange={setStartHourMin}
                    />
                    <TimeWheelDropdown
                      label="Hora fin"
                      value={endHourMin}
                      onChange={setEndHourMin}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setScheduling(false)}
                      className="px-4 py-2 rounded-full border border-borderClinik text-xs font-semibold text-primary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleScheduleNext}
                      disabled={loading}
                      className="px-4 py-2 rounded-full bg-secondary text-white text-xs font-bold disabled:opacity-50"
                    >
                      {loading ? "Agendando..." : "Confirmar Cita"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {editingSession && (
            <div
              id="edit-session-section"
              className="border-t border-gray-100 pt-4"
            >
              <p className="text-xs font-bold text-primary uppercase mb-3">
                Editar Sesión {editingSession.sessionNumber}
              </p>
              <div className="flex flex-col gap-3 bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                <select
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white"
                >
                  <option value="">Sin asignar</option>
                  {collaborators.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                      Día
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="2"
                      placeholder="DD"
                      value={editDateParts.day}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 2);
                        setEditDateParts((prev) => ({ ...prev, day: raw }));
                      }}
                      onBlur={(e) => {
                        if (e.target.value.length === 1) {
                          setEditDateParts((prev) => ({
                            ...prev,
                            day: prev.day.padStart(2, "0"),
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-wide">
                      Mes
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="2"
                      placeholder="MM"
                      value={editDateParts.month}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 2);
                        setEditDateParts((prev) => ({ ...prev, month: raw }));
                      }}
                      onBlur={(e) => {
                        if (e.target.value.length === 1) {
                          setEditDateParts((prev) => ({
                            ...prev,
                            month: prev.month.padStart(2, "0"),
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <WheelDropdown
                    label="Año"
                    value={editDateParts.year}
                    options={YEARS}
                    onChange={(v) =>
                      setEditDateParts((prev) => ({ ...prev, year: v }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TimeWheelDropdown
                    label="Hora inicio"
                    value={editStartHourMin}
                    onChange={setEditStartHourMin}
                  />
                  <TimeWheelDropdown
                    label="Hora fin"
                    value={editEndHourMin}
                    onChange={setEditEndHourMin}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingSession(null)}
                    className="px-4 py-2 rounded-full border border-borderClinik text-xs font-semibold text-primary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveSessionEdit}
                    disabled={editLoading}
                    className="px-4 py-2 rounded-full bg-secondary text-white text-xs font-bold disabled:opacity-50"
                  >
                    {editLoading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageDetailModal;
