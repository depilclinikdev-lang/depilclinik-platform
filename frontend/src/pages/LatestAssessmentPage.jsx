import { useEffect, useState } from "react";
import api from "../services/api";
import { LuArrowLeft } from "react-icons/lu";
import AssessmentSummaryView from "../components/clinicalRecord/AssessmentSummaryView";
import ModelhaAssessmentForm from "../components/clinicalRecord/ModelhaAssessmentForm";
import LaserAssessmentForm from "../components/clinicalRecord/LaserAssessmentForm";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const LatestAssessmentPage = ({ customer, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState(null);
  const [brand, setBrand] = useState("Modelha DK");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatAssessmentDate = (assessmentObj) => {
    const rawDate =
      assessmentObj?.createdAt ||
      assessmentObj?.created_at ||
      assessmentObj?.date ||
      assessmentObj?.assessmentDate;

    if (!rawDate) return "Fecha no registrada";

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) return "Fecha no registrada";

    return parsedDate.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint =
          brand === "Modelha DK"
            ? `/assessments/customer/${customer.customerId}/latest`
            : `/laser-assessments/customer/${customer.customerId}/latest`;

        const response = await api.get(endpoint);
        setAssessment(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setAssessment(null);
        } else {
          setError(
            err.response?.data?.message || "No se pudo cargar el expediente.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, [customer.customerId, brand]);
  const handleUpdateAssessment = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando cambios...");
    try {
      const idKey =
        brand === "Modelha DK" ? "assessmentId" : "laserAssessmentId";
      const endpoint =
        brand === "Modelha DK"
          ? `/assessments/${assessment[idKey]}`
          : `/laser-assessments/${assessment[idKey]}`;

      await api.put(endpoint, formPayload);

      closeAlert();
      showSuccess("Expediente actualizado");
      setIsEditing(false);

      const refreshEndpoint =
        brand === "Modelha DK"
          ? `/assessments/customer/${customer.customerId}/latest`
          : `/laser-assessments/customer/${customer.customerId}/latest`;
      const response = await api.get(refreshEndpoint);
      setAssessment(response.data);
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
          <h2 className="text-xl font-bold text-primary">Último Expediente</h2>
          <p className="text-xs text-accent">{customer.name}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["Modelha DK", "Depilclinik"].map((b) => (
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando expediente...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center font-medium p-8 text-sm">
            {error}
          </p>
        ) : !assessment ? (
          <p className="text-accent text-center font-medium p-8 text-sm">
            Este cliente aún no tiene expedientes de {brand}.
          </p>
        ) : (
          <>
            <p className="text-xs text-accent mb-4 font-semibold">
              Sesión del {formatAssessmentDate(assessment)}
            </p>
            <AssessmentSummaryView assessment={assessment} />
          </>
        )}
      </div>
    </div>
  );
  <AssessmentSummaryView
    assessment={assessment}
    onEdit={() => setIsEditing(true)}
  />;
  {
    isEditing && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col text-left">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
            <h2 className="text-lg font-bold text-primary">
              Editar Expediente — {customer.name}
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="p-8 overflow-y-auto flex-1">
            {brand === "Modelha DK" ? (
              <ModelhaAssessmentForm
                onSubmit={handleUpdateAssessment}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                initialData={assessment}
                isEditMode
              />
            ) : (
              <LaserAssessmentForm
                onSubmit={handleUpdateAssessment}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                initialData={assessment}
                isEditMode
              />
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default LatestAssessmentPage;
