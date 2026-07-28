import React from "react";
import { LuFileCheck } from "react-icons/lu";
import { STATUS_META } from "../constants/appointmentStatus";

const AppointmentDetailsModal = ({
  isOpen,
  appointment,
  onClose,
  onAttend,
  onEdit,
}) => {
  if (!isOpen || !appointment) return null;

  const formatTime = (value) =>
    new Date(value).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusMeta = STATUS_META[appointment.status] || {
    label: appointment.status,
    color: "#5b9fa6",
  };

  // El expediente ya existe si la marca correspondiente ya tiene su
  // registro clínico (Modelha DK -> medicalAssessment, Depilclinik ->
  // laserAssessment). En ese caso ya no se debe ofrecer "llenar desde
  // cero"; la única forma de consultarlo es desde el expediente del
  // cliente.
  const hasAssessment =
    appointment.marca === "Modelha DK"
      ? Boolean(appointment.medicalAssessment)
      : Boolean(appointment.laserAssessment);

  const canAttend =
    Boolean(onAttend) && !hasAssessment && appointment.status !== "Cancelada";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-left">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-primary">Detalle de la Cita</h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Cliente
            </span>
            <span className="text-sm font-semibold text-primary">
              {appointment.customer?.name || "Sin asignar"}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Servicio
            </span>
            <span className="text-sm font-semibold text-primary">
              {appointment.service?.name || "—"}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Horario
            </span>
            <span className="text-sm font-semibold text-primary">
              {formatTime(appointment.startTime)} —{" "}
              {formatTime(appointment.endTime)}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Marca
            </span>
            <span className="text-sm font-semibold text-primary">
              {appointment.marca}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Colaborador Asignado
            </span>
            <span className="text-sm font-semibold text-primary">
              {appointment.collaborator?.name || "Sin asignar"}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-accent uppercase mb-0.5">
              Estado
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white w-fit"
              style={{ backgroundColor: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {hasAssessment && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
              <LuFileCheck size={16} className="shrink-0" />
              Expediente ya registrado. Consúltalo desde el expediente del
              cliente.
            </div>
          )}

          {canAttend && (
            <button
              onClick={() => onAttend(appointment.appointmentId)}
              className="w-full px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              Atender / Llenar Expediente
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="w-full px-5 py-2.5 rounded-full border border-borderClinik text-primary font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Editar Cita
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
