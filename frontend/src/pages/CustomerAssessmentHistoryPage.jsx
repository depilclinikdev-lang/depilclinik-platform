import { useEffect, useState, useCallback } from "react";
import { LuArrowLeft, LuCalendar, LuFileText, LuClock } from "react-icons/lu";
import api from "../services/api";
import AssessmentSummaryView from "../components/clinicalRecord/AssessmentSummaryView";
import HistoricalAssessmentSetupModal from "../components/HistoricalAssessmentSetupModal";
import ModelhaAssessmentForm from "../components/clinicalRecord/ModelhaAssessmentForm";
import LaserAssessmentForm from "../components/clinicalRecord/LaserAssessmentForm";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const BRANDS = ["Modelha DK", "Depilclinik"];

const CustomerAssessmentHistoryPage = ({ customer, onBack }) => {
  const [brand, setBrand] = useState("Modelha DK");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const idKey = brand === "Modelha DK" ? "assessmentId" : "laserAssessmentId";

  const formatDate = (value) => {
    if (!value) return "Fecha no registrada";
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "Fecha no registrada";
    return parsed.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedId(null);
    try {
      const endpoint =
        brand === "Modelha DK"
          ? `/assessments/customer/${customer.customerId}/history`
          : `/laser-assessments/customer/${customer.customerId}/history`;

      const response = await api.get(endpoint);
      const sorted = [...(response.data || [])].sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at) -
          new Date(a.createdAt || a.created_at),
      );
      setHistory(sorted);
      if (sorted.length > 0) {
        setSelectedId(sorted[0][idKey]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudo cargar el historial de este cliente.",
      );
    } finally {
      setLoading(false);
    }
  }, [customer.customerId, brand, idKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selectedAssessment = history.find((h) => h[idKey] === selectedId);
  const totalSessions = history.length;

  const handleConfirmSetup = (data) => {
    setSetupData(data);
    setIsSetupModalOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveHistorical = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando expediente histórico...");
    try {
      const endpoint =
        setupData.brand === "Modelha DK"
          ? "/assessments/historical"
          : "/laser-assessments/historical";

      await api.post(endpoint, {
        ...formPayload,
        customerId: customer.customerId,
        serviceId: setupData.serviceId,
        performedByUserId: setupData.performedByUserId,
        assessmentDate: setupData.assessmentDate,
      });

      closeAlert();
      showSuccess("Expediente histórico guardado");
      setIsFormOpen(false);
      setSetupData(null);

      if (setupData.brand === brand) {
        fetchHistory();
      }
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo guardar el expediente",
      );
    } finally {
      setSaving(false);
    }
  };

  const [editingAssessment, setEditingAssessment] = useState(null);

  const handleUpdateAssessment = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando cambios...");
    try {
      const endpoint =
        brand === "Modelha DK"
          ? `/assessments/${editingAssessment[idKey]}`
          : `/laser-assessments/${editingAssessment[idKey]}`;

      await api.put(endpoint, formPayload);

      closeAlert();
      showSuccess("Expediente actualizado");
      setEditingAssessment(null);
      fetchHistory();
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo actualizar el expediente",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-colors cursor-pointer"
        >
          <LuArrowLeft size={18} />
          Regresar
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <div>
          <h2 className="text-xl font-bold text-primary">
            Historial de Expedientes
          </h2>
          <p className="text-xs text-accent">{customer.name}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                brand === b
                  ? "bg-linear-to-r from-secondary to-depil text-white"
                  : "border border-borderClinik text-primary hover:bg-gray-50"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsSetupModalOpen(true)}
          className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          + Registrar Expediente Histórico
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-secondary text-center font-medium text-sm">
            Cargando historial...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-red-600 text-center font-medium text-sm">
            {error}
          </p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-accent text-center font-medium text-sm">
            Este cliente aún no tiene expedientes de {brand}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                <LuClock size={14} className="text-secondary" />
                Sesiones
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                {totalSessions}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-gray-50 max-h-125 overflow-y-auto">
              {history.map((item, index) => {
                const isSelected = item[idKey] === selectedId;
                const sessionNumber = totalSessions - index;
                return (
                  <button
                    key={item[idKey]}
                    onClick={() => setSelectedId(item[idKey])}
                    className={`text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-secondary/5 border-l-4 border-secondary"
                        : "border-l-4 border-transparent hover:bg-gray-50/70"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected
                          ? "bg-secondary text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {sessionNumber}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-secondary" : "text-primary"
                        }`}
                      >
                        Sesión {sessionNumber}
                      </p>
                      <p className="text-[11px] text-accent flex items-center gap-1 mt-0.5">
                        <LuCalendar size={11} />
                        {formatShortDate(item.createdAt || item.created_at)}
                      </p>
                      {item.appointment?.service?.name && (
                        <p className="text-[10px] text-secondary font-semibold truncate mt-0.5">
                          {item.appointment.service.name}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {selectedAssessment ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <LuFileText size={18} className="text-depil" />
                    <p className="text-sm font-bold text-primary">
                      Sesión del{" "}
                      {formatDate(
                        selectedAssessment.createdAt ||
                          selectedAssessment.created_at,
                      )}
                    </p>
                  </div>
                  {selectedAssessment.appointment?.service?.name && (
                    <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary">
                      {selectedAssessment.appointment.service.name}
                    </span>
                  )}
                </div>
                <AssessmentSummaryView
                  assessment={selectedAssessment}
                  onEdit={setEditingAssessment}
                />
              </>
            ) : (
              <p className="text-sm text-accent text-center py-8">
                Selecciona una sesión para ver el detalle.
              </p>
            )}
          </div>
        </div>
      )}

      <HistoricalAssessmentSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onConfirm={handleConfirmSetup}
        initialBrand={brand}
      />

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col text-left">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <h2 className="text-lg font-bold text-primary">
                Expediente Histórico — {customer.name}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {setupData?.brand === "Modelha DK" ? (
                <ModelhaAssessmentForm
                  onSubmit={handleSaveHistorical}
                  saving={saving}
                  customerName={customer.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  embedded
                />
              ) : (
                <LaserAssessmentForm
                  onSubmit={handleSaveHistorical}
                  saving={saving}
                  customerName={customer.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  embedded
                />
              )}
            </div>
          </div>
        </div>
      )}

      {editingAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col text-left">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <h2 className="text-lg font-bold text-primary">
                Editar Expediente — {customer.name}
              </h2>
              <button
                onClick={() => setEditingAssessment(null)}
                className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {brand === "Modelha DK" ? (
                <ModelhaAssessmentForm
                  onSubmit={handleUpdateAssessment}
                  saving={saving}
                  customerName={customer.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  initialData={editingAssessment}
                  isEditMode
                  embedded
                />
              ) : (
                <LaserAssessmentForm
                  onSubmit={handleUpdateAssessment}
                  saving={saving}
                  customerName={customer.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  initialData={editingAssessment}
                  isEditMode
                  embedded
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CustomerAssessmentHistoryPage;

export default CustomerAssessmentHistoryPage;
