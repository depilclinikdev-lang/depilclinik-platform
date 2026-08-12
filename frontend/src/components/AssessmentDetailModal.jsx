import React from "react";
import { LuX, LuHistory } from "react-icons/lu";
import AssessmentSummaryView from "./clinicalRecord/AssessmentSummaryView";

const AssessmentDetailModal = ({
  isOpen,
  assessment,
  onClose,
  onViewFullHistory,
  onEdit,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime())
      ? ""
      : ` · ${parsed.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div>
            <h2 className="text-lg font-bold text-primary">
              Expediente Clínico
            </h2>
            <p className="text-xs text-accent">
              {assessment?.customer?.name || "Cliente"}
              {formatDate(assessment?.createdAt || assessment?.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onViewFullHistory && assessment?.customer && (
              <button
                onClick={() => onViewFullHistory(assessment.customer)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors cursor-pointer"
                title="Ver todas las sesiones de este cliente"
              >
                <LuHistory size={14} />
                Historial completo
              </button>
            )}
            <button
              onClick={onClose}
              className="text-accent hover:text-primary text-sm font-bold cursor-pointer p-1"
            >
              <LuX size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {assessment ? (
            <AssessmentSummaryView assessment={assessment} onEdit={onEdit} />
          ) : (
            <p className="text-sm text-accent text-center py-8">Cargando...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetailModal;
