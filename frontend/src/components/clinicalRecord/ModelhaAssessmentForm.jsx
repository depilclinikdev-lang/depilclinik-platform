import React, { useState } from "react";
import {
  TextField,
  TextAreaField,
  SelectField,
  CheckboxGrid,
  RatingSlider,
} from "./FormField";
import {
  PROFESSIONAL_TYPES,
  DIET_OPTIONS,
  SKIN_PRACTICES,
} from "../../constants/clinicalRecordOptions";
import AssessmentPhotosSection from "./AssessmentPhotosSection";

const TABS = [
  "General",
  "Hábitos",
  "Padecimientos",
  "Corporal",
  "Facial",
  "Fotos",
];

const BACKGROUND_ITEMS = [
  { key: "hasDiabetes", label: "Diabetes / prediabetes" },
  { key: "hasHyperthyroidism", label: "Hipertiroidismo" },
  { key: "hasHypothyroidism", label: "Hipotiroidismo" },
  { key: "hasPolicysticOvary", label: "Ovario Poliquístico" },
  { key: "hasHeartFailure", label: "Insuficiencia cardíaca" },
  { key: "hasHypertensionHypotension", label: "Hipertensión / hipotensión" },
  { key: "hasHighCholesterol", label: "Colesterol alto" },
  { key: "hasThrombosis", label: "Trombosis" },
  { key: "hasEpilepsy", label: "Epilepsia" },
  { key: "hasMigraine", label: "Migraña" },
  { key: "hasConvulsions", label: "Convulsiones" },
  { key: "hasPhobias", label: "Fobias" },
  { key: "hasDepression", label: "Depresión" },
  { key: "hasAnxiety", label: "Ansiedad" },
  { key: "hasGastritis", label: "Gastritis" },
  { key: "hasIrritableColon", label: "Colon irritable" },
  { key: "hasDigestiveDisconforts", label: "Malestares digestivos" },
  { key: "hasKidneyDiseases", label: "Afecciones renales" },
  { key: "hasCancerHistory", label: "Cáncer / Antecedentes" },
  { key: "hasHivAids", label: "VIH / SIDA" },
  { key: "hasHepatitis", label: "Hepatitis" },
  { key: "hasHerpes", label: "Herpes" },
  { key: "hasFever", label: "Fiebre" },
  { key: "hasBodyHeadPain", label: "Dolor de cabeza / cuerpo" },
  { key: "hasThroatInflammation", label: "Inflamación garganta" },
  { key: "hasVomitingNausea", label: "Vómitos / náuseas" },
  { key: "hasEyeDiseases", label: "Conjuntivitis, afecciones oculares" },
  { key: "hasContactLentes", label: "Lentes de contacto" },
  { key: "hasEyelashExtensions", label: "Extensiones, permanentes, pestañas" },
  { key: "hasPacemaker", label: "Marcapasos" },
  { key: "hasMetalPlates", label: "Placas metálicas / dispositivos" },
  { key: "hasImplants", label: "Implantes faciales / corporales" },
  { key: "hasEstheticFillers", label: "Procedimientos estéticos / fillers" },
  { key: "hasSurgeries", label: "Cirugías" },
  { key: "hasFractures", label: "Lesiones / fracturas" },
  { key: "hasMedications", label: "Medicamentos / suplementos" },
  { key: "hasPregnancyLactation", label: "Embarazo / lactancia" },
];

const ALLERGY_ITEMS = [
  { key: "allergyFood", label: "Alimentos" },
  { key: "allergyMedication", label: "Medicamento / suplemento" },
  { key: "allergyMaterial", label: "Material" },
  { key: "allergyProductIngredient", label: "Producto / ingrediente" },
  { key: "allergyObjectAnimal", label: "Objeto / planta / animal" },
  { key: "hasDermographism", label: "Presencia de dermografismo" },
  { key: "hasSunRedness", label: "Rojez al exponerse al Sol" },
  { key: "hasPetsAtHome", label: "Mascotas en casa" },
  { key: "hasStressReaction", label: "Reacción por estrés" },
];

const ZONES = [
  "Abdomen",
  "Waist",
  "Hips",
  "Thighs",
  "Arms",
  "UpperBack",
  "LowerBack",
  "Chin",
];
const ZONE_LABELS = {
  Abdomen: "Abdomen",
  Waist: "Cintura",
  Hips: "Caderas",
  Thighs: "Muslos",
  Arms: "Brazos",
  UpperBack: "Espalda A",
  LowerBack: "Espalda Baja",
  Chin: "Papada",
};

const zoneItems = (prefix) =>
  ZONES.map((z) => ({ key: `${prefix}${z}`, label: ZONE_LABELS[z] }));

const initialState = {
  general: {
    consultationReason: "",
    onsetDateDetails: "",
    knownCause: "",
    previousCare: "",
    bloodType: "",
    residenceTime: "",
    temperatureC: "",
    bloodPressure: "",
    oxygenSaturation: "",
    heartRateBpm: "",
    referredMedia: "",
    professionalAssessment: "",
    hasSignedConsent: false,
  },
  selectedProfessionals: [],
  professionalDetails: {},
  gynecoRecord: {
    periodStartAge: "",
    menopauseStartAge: "",
    lastPeriodDate: "",
    periodType: "",
    contraceptiveMethod: "",
    emergencyContraceptive: "",
  },
  skincareRoutine: {},
  lifestyleHabit: {
    makeupFrequency: "",
    washingFrequency: "",
    physicalActivityDetails: "",
    sleepTime: "",
    wakeTime: "",
    stressLevel: 5,
    dayDescription: "",
  },
  dietRatingsMap: {
    refrescos: 5,
    bebidas_energizantes: 5,
    cafe: 5,
    alcohol: 5,
    pan_dulce_azucar: 5,
    frituras: 5,
    comida_picante: 5,
    lacteos: 5,
    proteina_gimnasio: 5,
    carnes_rojas: 5,
    vegetales: 5,
    almendras_nueces: 5,
    frutas: 5,
    tabaco_vape: 5,
    cannabis_drogas: 5,
    litros_agua_diarios: 5,
  },
  skinPracticesSelected: [],
  medicalBackground: {},
  allergiesRecord: { allergyDetails: "" },
  bodyEvaluation: {},
  facialEvaluation: {
    skinAge: "",
    secretionType: "",
    phototype: "",
    affectionInflammation: false,
    affectionAcne: false,
    affectionSpots: false,
    affectionRosacea: false,
    affectionSensitivity: false,
    affectionAging: false,
    affectionFlaccidity: false,
    affectionPhotoaging: false,
    primaryEphelides: false,
    primaryMacules: false,
    primaryLentigos: false,
    primaryComedones: false,
    primaryMilliums: false,
    primaryVesicles: false,
    primaryPapules: false,
    primaryPustules: false,
    primaryScales: false,
    primaryCysts: false,
    secondaryScars: false,
    secondaryCrusts: false,
    secondaryNodules: false,
    secondaryTubercle: false,
    secondaryMarks: false,
    secondaryUlcers: false,
    secondaryErythrosis: false,
    secondaryPustules: false,
    secondaryScales: false,
    secondaryCysts: false,
    pigmentationMelasma: false,
    pigmentationLentigos: false,
    pigmentationPostInflammatory: false,
    pigmentationAchromia: false,
    pigmentationVitiligo: false,
    pigmentationOther: "",
    vascularErythema: false,
    vascularErythrosis: false,
    vascularTelangiectasias: false,
    vascularCouperose: false,
    vascularAngiomas: false,
    vascularOther: "",
    agingFurrows: false,
    agingWrinkles: false,
    agingExpressionLines: false,
    agingFlaccidity: false,
    agingAngiomas: false,
    agingOther: "",
    glogauScale: "",
    glogauObservations: "",
    facialNotes: "",
  },
};

const ModelhaAssessmentForm = ({
  onSubmit,
  saving,
  customerName,
  pendingPhotos = {},
  onPhotoSelect,
  initialData = null,
  isEditMode = false,
  embedded = false,
}) => {
  const buildStateFromAssessment = (assessment) => {
    if (!assessment) return initialState;

    return {
      general: {
        consultationReason: assessment.consultationReason || "",
        onsetDateDetails: assessment.onsetDateDetails || "",
        knownCause: assessment.knownCause || "",
        previousCare: assessment.previousCare || "",
        bloodType: assessment.bloodType || "",
        residenceTime: assessment.residenceTime || "",
        temperatureC: assessment.temperatureC || "",
        bloodPressure: assessment.bloodPressure || "",
        oxygenSaturation: assessment.oxygenSaturation || "",
        heartRateBpm: assessment.heartRateBpm || "",
        referredMedia: assessment.referredMedia || "",
        professionalAssessment: assessment.professionalAssessment || "",
        hasSignedConsent: Boolean(assessment.hasSignedConsent),
      },
      selectedProfessionals:
        assessment.professionalTreatments?.map((t) => t.professionalType) || [],
      professionalDetails:
        assessment.professionalTreatments?.reduce((acc, t) => {
          acc[t.professionalType] = t.treatmentDetails || "";
          return acc;
        }, {}) || {},
      gynecoRecord: {
        periodStartAge: assessment.gynecoRecord?.periodStartAge ?? "",
        menopauseStartAge: assessment.gynecoRecord?.menopauseStartAge ?? "",
        lastPeriodDate: assessment.gynecoRecord?.lastPeriodDate
          ? assessment.gynecoRecord.lastPeriodDate.slice(0, 10)
          : "",
        periodType: assessment.gynecoRecord?.periodType || "",
        contraceptiveMethod: assessment.gynecoRecord?.contraceptiveMethod || "",
        emergencyContraceptive:
          assessment.gynecoRecord?.emergencyContraceptive || "",
      },
      skincareRoutine: assessment.skincareRoutine || {},
      lifestyleHabit: {
        makeupFrequency: assessment.lifestyleHabit?.makeupFrequency || "",
        washingFrequency: assessment.lifestyleHabit?.washingFrequency || "",
        physicalActivityDetails:
          assessment.lifestyleHabit?.physicalActivityDetails || "",
        sleepTime: assessment.lifestyleHabit?.sleepTime || "",
        wakeTime: assessment.lifestyleHabit?.wakeTime || "",
        stressLevel: assessment.lifestyleHabit?.stressLevel ?? 5,
        dayDescription: assessment.lifestyleHabit?.dayDescription || "",
      },
      dietRatingsMap:
        assessment.dietRatings?.reduce((acc, d) => {
          acc[d.foodItem] = d.ratingValue;
          return acc;
        }, {}) || initialState.dietRatingsMap,
      skinPracticesSelected:
        assessment.skinPractices?.map((p) => p.substanceType) || [],
      medicalBackground: assessment.medicalBackground || {},
      allergiesRecord: assessment.allergiesRecord || { allergyDetails: "" },
      bodyEvaluation: assessment.bodyEvaluation || {},
      facialEvaluation:
        assessment.facialEvaluation || initialState.facialEvaluation,
    };
  };

  const [activeTab, setActiveTab] = useState("General");
  const [form, setForm] = useState(() => buildStateFromAssessment(initialData));

  const updateSection = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const toggleBool = (section, key) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: !prev[section]?.[key] },
    }));
  };

  const toggleProfessional = (type) => {
    setForm((prev) => {
      const exists = prev.selectedProfessionals.includes(type);
      return {
        ...prev,
        selectedProfessionals: exists
          ? prev.selectedProfessionals.filter((t) => t !== type)
          : [...prev.selectedProfessionals, type],
      };
    });
  };

  const toggleSkinPractice = (type) => {
    setForm((prev) => {
      const exists = prev.skinPracticesSelected.includes(type);
      return {
        ...prev,
        skinPracticesSelected: exists
          ? prev.skinPracticesSelected.filter((t) => t !== type)
          : [...prev.skinPracticesSelected, type],
      };
    });
  };

  const buildPayload = () => {
    const cleanGyneco = form.gynecoRecord
      ? {
          ...form.gynecoRecord,
          periodStartAge:
            form.gynecoRecord.periodStartAge === ""
              ? null
              : Number(form.gynecoRecord.periodStartAge),
          menopauseStartAge:
            form.gynecoRecord.menopauseStartAge === ""
              ? null
              : Number(form.gynecoRecord.menopauseStartAge),
          lastPeriodDate:
            form.gynecoRecord.lastPeriodDate === ""
              ? null
              : form.gynecoRecord.lastPeriodDate,
        }
      : null;

    return {
      general: {
        ...form.general,
        temperatureC: form.general.temperatureC || null,
        oxygenSaturation: form.general.oxygenSaturation || null,
        heartRateBpm: form.general.heartRateBpm || null,
      },
      professionalTreatments: form.selectedProfessionals.map((type) => ({
        professionalType: type,
        treatmentDetails: form.professionalDetails[type] || "",
      })),
      gynecoRecord:
        cleanGyneco && Object.values(cleanGyneco).some((v) => v !== null)
          ? cleanGyneco
          : null,
      skincareRoutine: Object.keys(form.skincareRoutine).length
        ? form.skincareRoutine
        : null,
      lifestyleHabit: form.lifestyleHabit,
      dietRatings: Object.entries(form.dietRatingsMap).map(
        ([foodItem, ratingValue]) => ({
          foodItem,
          ratingValue: Number(ratingValue),
        }),
      ),
      skinPractices: form.skinPracticesSelected.map((substanceType) => ({
        substanceType,
      })),
      medicalBackground: form.medicalBackground,
      allergiesRecord: form.allergiesRecord,
      bodyEvaluation: form.bodyEvaluation,
      facialEvaluation: form.facialEvaluation,
    };
  };

  const handleSaveClick = () => {
    onSubmit(buildPayload());
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className={
          embedded
            ? "sticky top-0 z-10 -mx-6 px-6 pt-0 pb-3 bg-white border-b border-gray-100"
            : "sticky top-16 z-10 -mx-8 px-8 pt-2 pb-3 bg-white border-b border-gray-100"
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
                  ? "bg-linear-to-r from-secondary to-depil text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "General" && (
        <div className="flex flex-col gap-4">
          <TextAreaField
            label="Motivo de consulta *"
            value={form.general.consultationReason}
            onChange={(v) => updateSection("general", "consultationReason", v)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="¿Cuándo comenzó la situación?"
              value={form.general.onsetDateDetails}
              onChange={(v) => updateSection("general", "onsetDateDetails", v)}
            />
            <SelectField
              label="¿Dónde nos conociste? *"
              value={form.general.referredMedia}
              onChange={(v) => updateSection("general", "referredMedia", v)}
              options={[
                "Instagram",
                "Facebook",
                "TikTok",
                "Recomendacion",
                "Por su cuenta",
                "Otro",
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextAreaField
              label="¿La causa es conocida?"
              value={form.general.knownCause}
              onChange={(v) => updateSection("general", "knownCause", v)}
              rows={2}
            />
            <TextAreaField
              label="¿Han habido cuidados previos?"
              value={form.general.previousCare}
              onChange={(v) => updateSection("general", "previousCare", v)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <TextField
              label="Tipo de sangre (RH)"
              value={form.general.bloodType}
              onChange={(v) => updateSection("general", "bloodType", v)}
              placeholder="Ej. O+"
            />
            <TextField
              label="Tiempo radicando"
              value={form.general.residenceTime}
              onChange={(v) => updateSection("general", "residenceTime", v)}
              placeholder="Ej. 5 años"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary uppercase mb-2">
              ¿Bajo tratamiento con los siguientes profesionales?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PROFESSIONAL_TYPES.map((prof) => (
                <label
                  key={prof.value}
                  className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedProfessionals.includes(prof.value)}
                    onChange={() => toggleProfessional(prof.value)}
                    className="accent-secondary h-4 w-4 rounded border-borderClinik"
                  />
                  {prof.label}
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {form.selectedProfessionals.map((value) => {
                const prof = PROFESSIONAL_TYPES.find((p) => p.value === value);
                return (
                  <TextField
                    key={value}
                    label={`Detalles con ${prof?.label || value}`}
                    value={form.professionalDetails[value] || ""}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        professionalDetails: {
                          ...prev.professionalDetails,
                          [value]: v,
                        },
                      }))
                    }
                  />
                );
              })}
            </div>
          </div>

          <TextAreaField
            label="Tratamientos, observaciones, diagnóstico del profesional"
            value={form.general.professionalAssessment}
            onChange={(v) =>
              updateSection("general", "professionalAssessment", v)
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
            <TextField
              label="Temperatura (°C)"
              type="number"
              value={form.general.temperatureC}
              onChange={(v) => updateSection("general", "temperatureC", v)}
            />
            <TextField
              label="Presión arterial"
              value={form.general.bloodPressure}
              onChange={(v) => updateSection("general", "bloodPressure", v)}
              placeholder="120/80"
            />
            <TextField
              label="Oxigenación (%)"
              type="number"
              value={form.general.oxygenSaturation}
              onChange={(v) => updateSection("general", "oxygenSaturation", v)}
            />
            <TextField
              label="Frec. cardíaca (bpm)"
              type="number"
              value={form.general.heartRateBpm}
              onChange={(v) => updateSection("general", "heartRateBpm", v)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-primary mb-3">Mujer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Edad de inicio de periodo / menopausia"
                value={form.gynecoRecord.periodStartAge}
                onChange={(v) =>
                  updateSection("gynecoRecord", "periodStartAge", v)
                }
              />
              <TextField
                label="Fecha de último periodo"
                type="date"
                value={form.gynecoRecord.lastPeriodDate}
                onChange={(v) =>
                  updateSection("gynecoRecord", "lastPeriodDate", v)
                }
              />
              <SelectField
                label="¿Cómo son tus periodos?"
                value={form.gynecoRecord.periodType}
                onChange={(v) => updateSection("gynecoRecord", "periodType", v)}
                options={["Regular", "Irregular", "Cólicos", "Antojos"]}
              />
              <TextField
                label="Método anticonceptivo"
                value={form.gynecoRecord.contraceptiveMethod}
                onChange={(v) =>
                  updateSection("gynecoRecord", "contraceptiveMethod", v)
                }
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "Hábitos" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Frecuencia de uso de maquillaje"
              value={form.lifestyleHabit.makeupFrequency}
              onChange={(v) =>
                updateSection("lifestyleHabit", "makeupFrequency", v)
              }
            />
            <TextField
              label="Frecuencia de lavado de sábanas/brochas"
              value={form.lifestyleHabit.washingFrequency}
              onChange={(v) =>
                updateSection("lifestyleHabit", "washingFrequency", v)
              }
            />
          </div>
          <TextAreaField
            label="Actividad física y frecuencia semanal"
            value={form.lifestyleHabit.physicalActivityDetails}
            onChange={(v) =>
              updateSection("lifestyleHabit", "physicalActivityDetails", v)
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Hora de dormir"
              type="time"
              value={form.lifestyleHabit.sleepTime}
              onChange={(v) => updateSection("lifestyleHabit", "sleepTime", v)}
            />
            <TextField
              label="Hora de despertar"
              type="time"
              value={form.lifestyleHabit.wakeTime}
              onChange={(v) => updateSection("lifestyleHabit", "wakeTime", v)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary uppercase mb-3">
              Alimentación semanal (1 a 10)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIET_OPTIONS.map((item) => (
                <RatingSlider
                  key={item.value}
                  label={item.label}
                  value={form.dietRatingsMap[item.value] || 5}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      dietRatingsMap: {
                        ...prev.dietRatingsMap,
                        [item.value]: v,
                      },
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <RatingSlider
              label="Nivel de estrés diario"
              value={form.lifestyleHabit.stressLevel}
              onChange={(v) =>
                updateSection("lifestyleHabit", "stressLevel", v)
              }
            />
            <TextAreaField
              label="Describe un día en tu vida"
              value={form.lifestyleHabit.dayDescription}
              onChange={(v) =>
                updateSection("lifestyleHabit", "dayDescription", v)
              }
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary uppercase mb-2">
              ¿Se han realizado las siguientes prácticas?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SKIN_PRACTICES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 text-sm text-primary cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={form.skinPracticesSelected.includes(type.value)}
                    onChange={() => toggleSkinPractice(type.value)}
                    className="accent-secondary h-4 w-4 rounded border-borderClinik"
                  />
                  {type.value}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Padecimientos" && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Antecedentes médicos
            </p>
            <CheckboxGrid
              items={BACKGROUND_ITEMS}
              values={form.medicalBackground}
              onToggle={(key) => toggleBool("medicalBackground", key)}
              columns={3}
            />
            <TextAreaField
              label="Observaciones médicas"
              value={form.medicalBackground.medicalObservations || ""}
              onChange={(v) =>
                updateSection("medicalBackground", "medicalObservations", v)
              }
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Alergias y otras afecciones
            </p>
            <CheckboxGrid
              items={ALLERGY_ITEMS}
              values={form.allergiesRecord}
              onToggle={(key) => toggleBool("allergiesRecord", key)}
              columns={2}
            />
            <TextAreaField
              label="Fecha de última reacción, frecuencia, qué reacción se presenta"
              value={form.allergiesRecord.allergyDetails}
              onChange={(v) =>
                updateSection("allergiesRecord", "allergyDetails", v)
              }
            />
          </div>
        </div>
      )}

      {activeTab === "Corporal" && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Antropometría
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["weightKg", "Peso (kg)"],
                ["heightCm", "Talla (cm)"],
                ["waistCm", "Cintura (cm)"],
                ["abdomenCm", "Abdomen (cm)"],
                ["hipCm", "Cadera (cm)"],
                ["armsCm", "Brazos (cm)"],
                ["legCm", "Pierna (cm)"],
                ["bmi", "IMC"],
              ].map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  value={form.bodyEvaluation[key] || ""}
                  onChange={(v) => updateSection("bodyEvaluation", key, v)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Pliegues cutáneos (mm)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["bicipitalFoldMm", "Bicipital"],
                ["tricipitalFoldMm", "Tricipital"],
                ["abdominalFoldMm", "Abdominal"],
                ["subiliacFoldMm", "S. Iliaco"],
                ["crestFoldMm", "Cresta"],
                ["scapularFoldMm", "Escapular"],
                ["thighFoldMm", "Muslo"],
              ].map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  type="number"
                  value={form.bodyEvaluation[key] || ""}
                  onChange={(v) => updateSection("bodyEvaluation", key, v)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Adiposidades localizadas
            </p>
            <CheckboxGrid
              items={zoneItems("fat")}
              values={form.bodyEvaluation}
              onToggle={(key) => toggleBool("bodyEvaluation", key)}
              columns={4}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Celulitis
            </p>
            <CheckboxGrid
              items={zoneItems("cellulite")}
              values={form.bodyEvaluation}
              onToggle={(key) => toggleBool("bodyEvaluation", key)}
              columns={4}
            />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <SelectField
                label="Textura"
                value={form.bodyEvaluation.celluliteTexture || ""}
                onChange={(v) =>
                  updateSection("bodyEvaluation", "celluliteTexture", v)
                }
                options={["Flacida", "Compacta", "Mixta", "Edematosa"]}
              />
              <TextField
                label="Grado"
                value={form.bodyEvaluation.celluliteGrade || ""}
                onChange={(v) =>
                  updateSection("bodyEvaluation", "celluliteGrade", v)
                }
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Estrías
            </p>
            <CheckboxGrid
              items={zoneItems("stretchmarks")}
              values={form.bodyEvaluation}
              onToggle={(key) => toggleBool("bodyEvaluation", key)}
              columns={4}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Varices
            </p>
            <CheckboxGrid
              items={[
                { key: "varicesSmall", label: "Pequeñas" },
                { key: "varicesVisible", label: "Visibles" },
                { key: "varicesEdema", label: "Edema" },
                { key: "varicesUlcers", label: "Ulceras" },
                { key: "varicesDiscoloration", label: "Coloración" },
                { key: "varicesTelangiectasias", label: "Telangiectasias" },
              ]}
              values={form.bodyEvaluation}
              onToggle={(key) => toggleBool("bodyEvaluation", key)}
              columns={3}
            />
          </div>

          <TextAreaField
            label="Diagnóstico corporal"
            value={form.bodyEvaluation.bodyDiagnosis || ""}
            onChange={(v) =>
              updateSection("bodyEvaluation", "bodyDiagnosis", v)
            }
          />
        </div>
      )}

      {activeTab === "Facial" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="Edad de la piel"
              value={form.facialEvaluation.skinAge || ""}
              onChange={(v) => updateSection("facialEvaluation", "skinAge", v)}
              options={["Joven", "Madura"]}
            />
            <SelectField
              label="Tipo de secreción"
              value={form.facialEvaluation.secretionType || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "secretionType", v)
              }
              options={["Seca", "Grasa", "Mixta"]}
            />
            <SelectField
              label="Fototipo"
              value={form.facialEvaluation.phototype || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "phototype", v)
              }
              options={["I", "II", "III", "IV", "V"]}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Afección
            </p>
            <CheckboxGrid
              items={[
                { key: "affectionInflammation", label: "Inflamación" },
                { key: "affectionAcne", label: "Acné" },
                { key: "affectionSpots", label: "Manchas" },
                { key: "affectionRosacea", label: "Rosácea" },
                { key: "affectionSensitivity", label: "Sensibilidad" },
                { key: "affectionAging", label: "Envejecimiento" },
                { key: "affectionFlaccidity", label: "Flacidez" },
                { key: "affectionPhotoaging", label: "Foto envejecimiento" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={4}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Alteraciones Primarias
            </p>
            <CheckboxGrid
              items={[
                { key: "primaryEphelides", label: "Efélides" },
                { key: "primaryMacules", label: "Máculas" },
                { key: "primaryLentigos", label: "Léntigos" },
                { key: "primaryComedones", label: "Comedones" },
                { key: "primaryMilliums", label: "Milliums" },
                { key: "primaryVesicles", label: "Vesículas" },
                { key: "primaryPapules", label: "Pápulas" },
                { key: "primaryPustules", label: "Pústulas" },
                { key: "primaryScales", label: "Escamas" },
                { key: "primaryCysts", label: "Quistes" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={4}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Alteraciones Secundarias
            </p>
            <CheckboxGrid
              items={[
                { key: "secondaryScars", label: "Escaras" },
                { key: "secondaryCrusts", label: "Costras" },
                { key: "secondaryNodules", label: "Nódulos" },
                { key: "secondaryTubercle", label: "Tubérculo" },
                { key: "secondaryMarks", label: "Tatuajes" },
                { key: "secondaryUlcers", label: "Úlceras" },
                { key: "secondaryErythrosis", label: "Eritrosis" },
                { key: "secondaryPustules", label: "Pústulas" },
                { key: "secondaryScales", label: "Escamas" },
                { key: "secondaryCysts", label: "Quistes" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={4}
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Alteraciones de la Pigmentación
            </p>
            <CheckboxGrid
              items={[
                { key: "pigmentationMelasma", label: "Melasma" },
                { key: "pigmentationLentigos", label: "Léntigos" },
                {
                  key: "pigmentationPostInflammatory",
                  label: "Máculas Postinflamatorias",
                },
                { key: "pigmentationAchromia", label: "Acromías" },
                { key: "pigmentationVitiligo", label: "Vitíligo" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={3}
            />
            <TextField
              label="Otros"
              value={form.facialEvaluation.pigmentationOther || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "pigmentationOther", v)
              }
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Alteraciones de la Vascularización
            </p>
            <CheckboxGrid
              items={[
                { key: "vascularErythema", label: "Eritema" },
                { key: "vascularErythrosis", label: "Eritrosis" },
                { key: "vascularTelangiectasias", label: "Telangiectasias" },
                { key: "vascularCouperose", label: "Cuperosis" },
                { key: "vascularAngiomas", label: "Angiomas" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={3}
            />
            <TextField
              label="Otros"
              value={form.facialEvaluation.vascularOther || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "vascularOther", v)
              }
            />
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Envejecimiento
            </p>
            <CheckboxGrid
              items={[
                { key: "agingFurrows", label: "Surcos" },
                { key: "agingWrinkles", label: "Arrugas" },
                { key: "agingExpressionLines", label: "Líneas de expresión" },
                { key: "agingFlaccidity", label: "Flacidez" },
                { key: "agingAngiomas", label: "Angiomas" },
              ]}
              values={form.facialEvaluation}
              onToggle={(key) => toggleBool("facialEvaluation", key)}
              columns={3}
            />
            <TextField
              label="Otros"
              value={form.facialEvaluation.agingOther || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "agingOther", v)
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Escala Glogau"
              value={form.facialEvaluation.glogauScale || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "glogauScale", v)
              }
              options={["I", "II", "III", "IV"]}
            />
            <TextField
              label="Observaciones Glogau"
              value={form.facialEvaluation.glogauObservations || ""}
              onChange={(v) =>
                updateSection("facialEvaluation", "glogauObservations", v)
              }
            />
          </div>

          <TextAreaField
            label="Notas faciales adicionales"
            value={form.facialEvaluation.facialNotes || ""}
            onChange={(v) =>
              updateSection("facialEvaluation", "facialNotes", v)
            }
          />
        </div>
      )}

      {activeTab === "Fotos" && (
        <AssessmentPhotosSection
          pendingUploads={pendingPhotos}
          onFileSelect={onPhotoSelect}
        />
      )}

      <div className="border-t border-gray-100 pt-4 flex justify-end">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="px-8 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
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

export default ModelhaAssessmentForm;
