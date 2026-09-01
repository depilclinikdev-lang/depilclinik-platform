import { useEffect, useState } from "react";
import api from "../services/api";
import {
  LuArrowLeft,
  LuCheck,
  LuRotateCw,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  showConfirm,
  showError,
  showLoading,
  closeAlert,
  showSuccess,
  showToast,
} from "../utils/alerts";
import ModelhaAssessmentForm from "../components/clinicalRecord/ModelhaAssessmentForm";
import LaserAssessmentForm from "../components/clinicalRecord/LaserAssessmentForm";

const ClinicalRecordPage = ({ appointmentId, currentUser, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointmentData, setAppointmentData] = useState(null);
  const [brand, setBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState({});

  const [savedRecord, setSavedRecord] = useState(null);
  const [photoRecords, setPhotoRecords] = useState([]);
  const [photoStatuses, setPhotoStatuses] = useState({});

  const handlePhotoSelect = (angle, file) => {
    setPendingPhotos((prev) => ({ ...prev, [angle]: file }));
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/appointments`);
        const found = response.data.find(
          (a) => a.appointmentId === appointmentId,
        );

        if (!found) {
          setError("No se encontró la cita solicitada.");
          return;
        }

        setBrand(found.marca);

        const endpoint =
          found.marca === "Modelha DK"
            ? `/assessments/appointment/${appointmentId}`
            : `/laser-assessments/appointment/${appointmentId}`;

        const assessmentResponse = await api.get(endpoint);
        setAppointmentData(assessmentResponse.data);
        setError("");
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "No se pudo cargar el expediente de esta cita.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleExitClick = async () => {
    if (savedRecord) {
      onExit();
      return;
    }

    const confirmed = await showConfirm({
      title: "¿Salir sin guardar?",
      text: "Los datos que hayas capturado en esta sesión no se guardarán.",
      icon: "warning",
      confirmButtonText: "Sí, salir",
    });
    if (confirmed) onExit();
  };

  const uploadPhotoForAngle = async (angle, file, records) => {
    const matchingPhoto = records.find((p) => p.photoAngle === angle);
    if (!matchingPhoto) {
      throw new Error(`No se encontró el registro de foto para "${angle}"`);
    }

    const formData = new FormData();
    formData.append("photo", file);
    await api.patch(`/assessment-photos/${matchingPhoto.photoId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleSave = async (payload) => {
    const confirmed = await showConfirm({
      title: "¿Guardar expediente?",
      text: "Una vez guardado, la cita quedará marcada como completada.",
      icon: "question",
      confirmButtonText: "Sí, guardar",
    });
    if (!confirmed) return;

    setSaving(true);
    showLoading("Guardando expediente...");
    try {
      const endpoint =
        brand === "Modelha DK"
          ? `/assessments/appointment/${appointmentId}`
          : `/laser-assessments/appointment/${appointmentId}`;

      const response = await api.post(endpoint, payload);
      const createdAssessment = response.data.assessment;
      setSavedRecord(createdAssessment);

      const photoQuery =
        brand === "Modelha DK"
          ? `assessmentId=${createdAssessment.assessmentId}`
          : `laserAssessmentId=${createdAssessment.laserAssessmentId}`;

      const photosResponse = await api.get(`/assessment-photos?${photoQuery}`);
      const records = photosResponse.data;
      setPhotoRecords(records);

      const results = {};
      for (const [angle, file] of Object.entries(pendingPhotos)) {
        try {
          await uploadPhotoForAngle(angle, file, records);
          results[angle] = "success";
        } catch (uploadErr) {
          console.error(`Error subiendo foto "${angle}":`, uploadErr);
          results[angle] = "error";
        }
      }
      setPhotoStatuses(results);

      closeAlert();

      const failedAngles = Object.entries(results)
        .filter(([, status]) => status === "error")
        .map(([angle]) => angle);

      if (failedAngles.length === 0) {
        showSuccess("Expediente guardado");
        onExit();
      } else {
        showError(
          "Expediente guardado con advertencias",
          `El expediente se guardó correctamente, pero ${failedAngles.length} foto(s) no se pudieron subir. Puedes reintentar antes de salir.`,
        );
      }
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message || "No se pudo guardar el expediente.";
      showError("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPhoto = async (angle) => {
    const file = pendingPhotos[angle];
    if (!file) return;

    setPhotoStatuses((prev) => ({ ...prev, [angle]: "uploading" }));
    try {
      await uploadPhotoForAngle(angle, file, photoRecords);
      setPhotoStatuses((prev) => ({ ...prev, [angle]: "success" }));
      showToast("success", `Foto "${angle}" subida correctamente`);
    } catch (err) {
      setPhotoStatuses((prev) => ({ ...prev, [angle]: "error" }));
      showError(
        "Error",
        `No se pudo subir la foto de "${angle}". Intenta de nuevo.`,
      );
    }
  };

  const failedAngles = Object.entries(photoStatuses)
    .filter(([, status]) => status === "error")
    .map(([angle]) => angle);

  const hasExistingAssessment = Boolean(
    appointmentData?.assessment && appointmentData?.isExactMatch,
  );
  const isTemplateFromOtherService = Boolean(
    appointmentData?.assessment && !appointmentData?.isExactMatch,
  );

  return (
    <div className="min-h-screen w-full bg-[#eef2f5] flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={handleExitClick}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-borderClinik bg-white text-sm font-bold text-primary hover:bg-gray-50 hover:border-secondary transition-colors cursor-pointer shadow-sm"
        >
          <LuArrowLeft size={18} />
          Regresar
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <span className="text-lg font-black tracking-wide text-primary">
          Expediente Clínico
          {brand && (
            <span className="ml-2 text-sm font-semibold text-accent">
              · {brand}
            </span>
          )}
        </span>
      </header>

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando expediente...
          </p>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-red-600 font-medium text-sm mb-4">{error}</p>
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs cursor-pointer"
            >
              Volver a la Agenda
            </button>
          </div>
        ) : savedRecord ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-5">
            {failedAngles.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <LuCheck size={28} />
                </div>
                <p className="text-primary font-bold">
                  Expediente guardado correctamente
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <LuTriangleAlert
                    size={20}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      El expediente se guardó, pero algunas fotos no
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Puedes reintentar la subida ahora o hacerlo después desde
                      el expediente del cliente.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {failedAngles.map((angle) => (
                    <div
                      key={angle}
                      className="flex items-center justify-between bg-gray-50/70 rounded-xl px-4 py-3 border border-gray-100"
                    >
                      <span className="text-sm font-semibold text-primary">
                        {angle}
                      </span>
                      <button
                        onClick={() => handleRetryPhoto(angle)}
                        disabled={photoStatuses[angle] === "uploading"}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary text-white text-xs font-bold hover:bg-[#14676f] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <LuRotateCw
                          size={13}
                          className={
                            photoStatuses[angle] === "uploading"
                              ? "animate-spin"
                              : ""
                          }
                        />
                        {photoStatuses[angle] === "uploading"
                          ? "Subiendo..."
                          : "Reintentar"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={onExit}
              className="w-full px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md"
            >
              {failedAngles.length === 0
                ? "Volver a la Agenda"
                : "Salir de todos modos"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {hasExistingAssessment && (
              <div className="mb-5 -mt-2 flex items-start gap-2.5 bg-secondary/5 border border-secondary/15 rounded-xl px-4 py-3">
                <LuTriangleAlert
                  size={16}
                  className="text-secondary shrink-0 mt-0.5"
                />
                <p className="text-xs text-primary">
                  Este cliente ya tiene un expediente de este servicio. Se
                  precargó con su última información — revísala y actualiza lo
                  que corresponda a esta sesión.
                </p>
              </div>
            )}

            {isTemplateFromOtherService && (
              <div className="mb-5 -mt-2 flex items-start gap-2.5 bg-secondary/5 border border-secondary/15 rounded-xl px-4 py-3">
                <LuTriangleAlert
                  size={16}
                  className="text-secondary shrink-0 mt-0.5"
                />
                <p className="text-xs text-primary">
                  Este es un servicio nuevo para este cliente. Se precargaron
                  sus datos generales de otro servicio ({" "}
                  <strong>revísalos y actualiza lo necesario</strong>) — las
                  notas de sesión son específicas de este servicio y arrancan
                  vacías.
                </p>
              </div>
            )}

            {brand === "Modelha DK" && (
              <ModelhaAssessmentForm
                onSubmit={handleSave}
                saving={saving}
                customerName={appointmentData?.customer?.name}
                pendingPhotos={pendingPhotos}
                onPhotoSelect={handlePhotoSelect}
                initialData={appointmentData?.assessment}
                requireSessionNote
              />
            )}

            {brand === "Depilclinik" && (
              <LaserAssessmentForm
                onSubmit={handleSave}
                saving={saving}
                customerName={appointmentData?.customer?.name}
                pendingPhotos={pendingPhotos}
                onPhotoSelect={handlePhotoSelect}
                initialData={appointmentData?.assessment}
                requireSessionNote
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClinicalRecordPage;
