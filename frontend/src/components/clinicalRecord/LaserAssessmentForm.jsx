import React, { useState } from "react";
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxGrid,
} from "./FormField";
import AssessmentPhotosSection from "./AssessmentPhotosSection";

const TABS = ["Información", "Historia Clínica", "Fotos", "Notas"];

const AREAS = ["Extra Chicas", "Chicas", "Mediana", "Grande", "Full Body"];

const CONDITION_ITEMS = [
  { key: "hasAcne", label: "Acné" },
  { key: "hasSkinSpots", label: "Manchas" },
  { key: "hasVitiligo", label: "Vitiligo" },
  { key: "hasVaricoseVeins", label: "Varices" },
  { key: "hasRosacea", label: "Rosacea" },
];

const HAIR_ITEMS = [
  { key: "hasAlopecia", label: "Alopecia" },
  { key: "hasHirsutism", label: "Hirsutismo" },
  { key: "hasPreviousShaving", label: "Depilación previa" },
  { key: "hasWaxingHistory", label: "Uso de cera" },
  { key: "takesSupplements", label: "Suplementos" },
];

const GYNECO_ITEMS = [
  { key: "usesContraceptives", label: "Anticonceptivos" },
  { key: "hasPregnancies", label: "Embarazos" },
  { key: "hasPcos", label: "SOP" },
];

const initialState = {
  serviceDate: "",
  general: {
    referredMedia: "",
    hasDiseases: false,
    diseasesNotes: "",
    hasMedications: false,
    medicationsNotes: "",
    hasTattoos: false,
    tattoosNotes: "",
    hasAllergies: false,
    allergiesNotes: "",
    hasAestheticProcedures: false,
    aestheticsProceduresNotes: "",
    hasSignedConsent: false,
  },
  selectedAreas: [],
  clinicalConditions: {},
};

const LaserAssessmentForm = ({
  onSubmit,
  saving,
  customerName,
  pendingPhotos = {},
  onPhotoSelect,
  initialData = null,
  isEditMode = false,
  embedded = false,
  requireSessionNote = false,
  packagesForNotes = [],
}) => {
  const buildStateFromAssessment = (assessment) => {
    if (!assessment) return initialState;

    return {
      serviceDate: assessment.serviceDate
        ? String(assessment.serviceDate).slice(0, 10)
        : "",
      general: {
        referredMedia: assessment.referredMedia || "",
        hasDiseases: Boolean(assessment.hasDiseases),
        diseasesNotes: assessment.diseasesNotes || "",
        hasMedications: Boolean(assessment.hasMedications),
        medicationsNotes: assessment.medicationsNotes || "",
        hasTattoos: Boolean(assessment.hasTattoos),
        tattoosNotes: assessment.tattoosNotes || "",
        hasAllergies: Boolean(assessment.hasAllergies),
        allergiesNotes: assessment.allergiesNotes || "",
        hasAestheticProcedures: Boolean(assessment.hasAestheticProcedures),
        aestheticsProceduresNotes: assessment.aestheticsProceduresNotes || "",
        hasSignedConsent: Boolean(assessment.hasSignedConsent),
      },
      selectedAreas: assessment.areasOfInterest?.map((a) => a.areaName) || [],
      clinicalConditions: assessment.clinicalConditions || {},
    };
  };

  const [activeTab, setActiveTab] = useState("Información");
  const [sessionNote, setSessionNote] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(() => buildStateFromAssessment(initialData));

  // Mapa packageId -> número de paquete (#1 = el más antiguo), para
  // mostrarlo junto a cada nota de sesión.
  const packageNumberMap = React.useMemo(() => {
    const map = {};
    const total = packagesForNotes.length;
    packagesForNotes.forEach((pkg, index) => {
      map[pkg.packageId] = total - index;
    });
    return map;
  }, [packagesForNotes]);

  const updateGeneral = (field, value) => {
    setForm((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }));
  };

  const toggleCondition = (key) => {
    setForm((prev) => ({
      ...prev,
      clinicalConditions: {
        ...prev.clinicalConditions,
        [key]: !prev.clinicalConditions[key],
      },
    }));
  };

  const toggleArea = (area) => {
    setForm((prev) => {
      const exists = prev.selectedAreas.includes(area);
      return {
        ...prev,
        selectedAreas: exists
          ? prev.selectedAreas.filter((a) => a !== area)
          : [...prev.selectedAreas, area],
      };
    });
  };

  const stripInternalIds = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const clean = { ...obj };
    delete clean.conditionId;
    delete clean.laserAssessmentId;
    return clean;
  };

  const buildPayload = () => ({
    ...(isEditMode && form.serviceDate
      ? { assessmentDate: form.serviceDate }
      : {}),
    ...(requireSessionNote ? { sessionNote } : {}),
    general: form.general,
    areasOfInterest: form.selectedAreas,
    clinicalConditions: stripInternalIds(form.clinicalConditions),
  });

  const validateForm = () => {
    if (requireSessionNote && !sessionNote.trim()) {
      return {
        tab: "Notas",
        message:
          "Debes escribir la nota de esta sesión antes de guardar. Si no quieres capturarla ahora, sal con el botón Regresar.",
      };
    }
    return null;
  };

  const handleSaveClick = () => {
    const error = validateForm();
    if (error) {
      setFormError(error.message);
      setActiveTab(error.tab);
      return;
    }
    setFormError("");
    onSubmit(buildPayload());
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className={
          embedded
            ? "px-6 pt-0 pb-3 bg-white border-b border-gray-100"
            : "-mx-8 -mt-8 px-8 pt-6 pb-3 bg-white border-b border-gray-100 rounded-t-2xl mb-6"
        }
      >
        {customerName && (
          <p className="text-xs text-accent mb-2">
            Cliente:{" "}
            <strong className="text-primary font-semibold">
              {customerName}
            </strong>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-linear-to-r from-depil to-secondary text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
          {formError}
        </div>
      )}
      {activeTab === "Información" && (
        <div className="flex flex-col gap-4">
          {isEditMode && (
            <TextField
              label="Fecha del servicio *"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.serviceDate}
              onChange={(v) => setForm((prev) => ({ ...prev, serviceDate: v }))}
            />
          )}
          <SelectField
            label="¿Dónde nos conociste? *"
            value={form.general.referredMedia}
            onChange={(v) => updateGeneral("referredMedia", v)}
            options={[
              "Instagram",
              "Facebook",
              "TikTok",
              "Recomendacion",
              "Por su cuenta",
              "Otro",
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.general.hasDiseases}
                onChange={(e) => updateGeneral("hasDiseases", e.target.checked)}
                className="accent-secondary h-4 w-4 rounded border-borderClinik"
              />
              Enfermedades
            </label>
            <TextField
              label="Observaciones"
              value={form.general.diseasesNotes}
              onChange={(v) => updateGeneral("diseasesNotes", v)}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.general.hasMedications}
                onChange={(e) =>
                  updateGeneral("hasMedications", e.target.checked)
                }
                className="accent-secondary h-4 w-4 rounded border-borderClinik"
              />
              Medicamentos
            </label>
            <TextField
              label="Observaciones"
              value={form.general.medicationsNotes}
              onChange={(v) => updateGeneral("medicationsNotes", v)}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.general.hasTattoos}
                onChange={(e) => updateGeneral("hasTattoos", e.target.checked)}
                className="accent-secondary h-4 w-4 rounded border-borderClinik"
              />
              Tatuajes
            </label>
            <TextField
              label="Observaciones"
              value={form.general.tattoosNotes}
              onChange={(v) => updateGeneral("tattoosNotes", v)}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.general.hasAllergies}
                onChange={(e) =>
                  updateGeneral("hasAllergies", e.target.checked)
                }
                className="accent-secondary h-4 w-4 rounded border-borderClinik"
              />
              Alergias
            </label>
            <TextField
              label="Observaciones"
              value={form.general.allergiesNotes}
              onChange={(v) => updateGeneral("allergiesNotes", v)}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.general.hasAestheticProcedures}
                onChange={(e) =>
                  updateGeneral("hasAestheticProcedures", e.target.checked)
                }
                className="accent-secondary h-4 w-4 rounded border-borderClinik"
              />
              Tx estéticos
            </label>
            <TextField
              label="Observaciones"
              value={form.general.aestheticsProceduresNotes}
              onChange={(v) => updateGeneral("aestheticsProceduresNotes", v)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-bold text-primary cursor-pointer select-none border-t border-gray-100 pt-4">
            <input
              type="checkbox"
              checked={form.general.hasSignedConsent}
              onChange={(e) =>
                updateGeneral("hasSignedConsent", e.target.checked)
              }
              className="accent-secondary h-4 w-4 rounded border-borderClinik"
            />
            Consentimiento firmado
          </label>
        </div>
      )}

      {activeTab === "Historia Clínica" && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Áreas de interés
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AREAS.map((area) => (
                <label
                  key={area}
                  className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedAreas.includes(area)}
                    onChange={() => toggleArea(area)}
                    className="accent-secondary h-4 w-4 rounded border-borderClinik"
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Datos estéticos
            </p>
            <CheckboxGrid
              items={CONDITION_ITEMS}
              values={form.clinicalConditions}
              onToggle={toggleCondition}
              columns={3}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Datos sobre el vello corporal
            </p>
            <CheckboxGrid
              items={HAIR_ITEMS}
              values={form.clinicalConditions}
              onToggle={toggleCondition}
              columns={3}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Historia ginecológica
            </p>
            <CheckboxGrid
              items={GYNECO_ITEMS}
              values={form.clinicalConditions}
              onToggle={toggleCondition}
              columns={3}
            />
            <TextAreaField
              label="Otros datos"
              value={form.clinicalConditions.gynecologicalOtherNotes}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  clinicalConditions: {
                    ...prev.clinicalConditions,
                    gynecologicalOtherNotes: v,
                  },
                }))
              }
            />
          </div>
        </div>
      )}

      {activeTab === "Fotos" && (
        <AssessmentPhotosSection
          pendingUploads={pendingPhotos}
          onFileSelect={onPhotoSelect}
        />
      )}

      {activeTab === "Notas" && (
        <div className="flex flex-col gap-4">
          {requireSessionNote && (
            <TextAreaField
              label="Nota de esta sesión *"
              value={sessionNote}
              onChange={setSessionNote}
              rows={4}
            />
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary uppercase mb-3">
              Historial de Notas
            </p>
            {!initialData?.sessionNotes ||
            initialData.sessionNotes.length === 0 ? (
              <p className="text-xs text-gray-400">
                Aún no hay notas registradas para este servicio.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {initialData.sessionNotes.map((note) => (
                  <div
                    key={note.noteId}
                    className="bg-gray-50/70 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-bold text-secondary">
                        {new Date(note.noteDate).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </p>
                      {note.packageId ? (
                        <span className="text-[10px] font-bold text-white bg-secondary/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {packageNumberMap[note.packageId]
                            ? `Paquete #${packageNumberMap[note.packageId]} · Sesión ${note.sessionNumber}`
                            : `Sesión ${note.sessionNumber} de paquete`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Cita individual
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary whitespace-pre-wrap">
                      {note.noteText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 flex justify-end">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="px-8 py-2.5 rounded-full bg-linear-to-r from-depil to-secondary text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
        >
          {saving
            ? "Guardando..."
            : isEditMode
              ? "Guardar Cambios"
              : "Guardar Expediente"}
        </button>
      </div>
    </div>
  );
};

export default LaserAssessmentForm;
