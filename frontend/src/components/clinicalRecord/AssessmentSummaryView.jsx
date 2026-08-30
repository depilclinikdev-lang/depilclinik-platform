import React, { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  PROFESSIONAL_TYPES,
  DIET_OPTIONS,
  SKIN_PRACTICES,
  findLabel,
} from "../../constants/clinicalRecordOptions";
import AssessmentPhotosGallery from "./AssessmentPhotosGallery";

const formatServiceDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const formatCapturedAt = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PERIOD_TYPE_LABELS = { Colicos: "Cólicos" };

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/70 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span className="text-xs font-bold text-primary uppercase">
          {title}
        </span>
        {open ? (
          <LuChevronUp size={16} className="text-accent" />
        ) : (
          <LuChevronDown size={16} className="text-accent" />
        )}
      </button>
      {open && <div className="p-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
};

const Field = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 text-sm">
      <span className="font-semibold text-primary shrink-0">{label}:</span>
      <span className="text-gray-600">{String(value)}</span>
    </div>
  );
};

const TagList = ({ label, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-primary">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// Extrae del objeto todas las claves booleanas en true y las convierte en
// una lista de labels legibles, usando el mapa {clave: etiqueta} que se pasa.
const booleanTags = (obj, labelMap) => {
  if (!obj) return [];
  return Object.entries(labelMap)
    .filter(([key]) => obj[key])
    .map(([, label]) => label);
};

const AssessmentSummaryView = ({ assessment, onEdit }) => {
  if (!assessment) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Este expediente no tiene datos capturados.
      </p>
    );
  }

  const backgroundLabels = {
    hasDiabetes: "Diabetes / prediabetes",
    hasHyperthyroidism: "Hipertiroidismo",
    hasHypothyroidism: "Hipotiroidismo",
    hasPolicysticOvary: "Ovario Poliquístico",
    hasHeartFailure: "Insuficiencia cardíaca",
    hasHypertensionHypotension: "Hipertensión / hipotensión",
    hasHighCholesterol: "Colesterol alto",
    hasThrombosis: "Trombosis",
    hasEpilepsy: "Epilepsia",
    hasMigraine: "Migraña",
    hasConvulsions: "Convulsiones",
    hasPhobias: "Fobias",
    hasDepression: "Depresión",
    hasAnxiety: "Ansiedad",
    hasGastritis: "Gastritis",
    hasIrritableColon: "Colon irritable",
    hasDigestiveDisconforts: "Malestares digestivos",
    hasKidneyDiseases: "Afecciones renales",
    hasCancerHistory: "Cáncer / Antecedentes",
    hasHivAids: "VIH / SIDA",
    hasHepatitis: "Hepatitis",
    hasHerpes: "Herpes",
    hasFever: "Fiebre",
    hasBodyHeadPain: "Dolor de cabeza / cuerpo",
    hasThroatInflammation: "Inflamación garganta",
    hasVomitingNausea: "Vómitos / náuseas",
    hasEyeDiseases: "Conjuntivitis, afecciones oculares",
    hasContactLentes: "Lentes de contacto",
    hasEyelashExtensions: "Extensiones, permanentes, pestañas",
    hasPacemaker: "Marcapasos",
    hasMetalPlates: "Placas metálicas / dispositivos",
    hasImplants: "Implantes faciales / corporales",
    hasEstheticFillers: "Procedimientos estéticos / fillers",
    hasSurgeries: "Cirugías",
    hasFractures: "Lesiones / fracturas",
    hasMedications: "Medicamentos / suplementos",
    hasPregnancyLactation: "Embarazo / lactancia",
  };

  const allergyLabels = {
    allergyFood: "Alimentos",
    allergyMedication: "Medicamento / suplemento",
    allergyMaterial: "Material",
    allergyProductIngredient: "Producto / ingrediente",
    allergyObjectAnimal: "Objeto / planta / animal",
    hasDermographism: "Presencia de dermografismo",
    hasSunRedness: "Rojez al exponerse al Sol",
    hasPetsAtHome: "Mascotas en casa",
    hasStressReaction: "Reacción por estrés",
  };

  const zoneLabels = {
    Abdomen: "Abdomen",
    Waist: "Cintura",
    Hips: "Caderas",
    Thighs: "Muslos",
    Legs: "Piernas",
    Arms: "Brazos",
    UpperBack: "Espalda A",
    LowerBack: "Espalda Baja",
    Chin: "Papada",
  };

  const zoneTags = (obj, prefix) => {
    if (!obj) return [];
    return Object.entries(zoneLabels)
      .filter(([zoneKey]) => obj[`${prefix}${zoneKey}`])
      .map(([, label]) => label);
  };

  const facialLabels = {
    affectionInflammation: "Inflamación",
    affectionAcne: "Acné",
    affectionSpots: "Manchas",
    affectionRosacea: "Rosácea",
    affectionSensitivity: "Sensibilidad",
    affectionAging: "Envejecimiento",
    affectionFlaccidity: "Flacidez",
    affectionPhotoaging: "Foto envejecimiento",
  };

  const primaryLabels = {
    primaryEphelides: "Efélides",
    primaryMacules: "Máculas",
    primaryLentigos: "Léntigos",
    primaryComedones: "Comedones",
    primaryMilliums: "Milliums",
    primaryVesicles: "Vesículas",
    primaryPapules: "Pápulas",
    primaryPustules: "Pústulas",
    primaryScales: "Escamas",
    primaryCysts: "Quistes",
  };

  const secondaryLabels = {
    secondaryScars: "Escaras",
    secondaryCrusts: "Costras",
    secondaryNodules: "Nódulos",
    secondaryTubercle: "Tubérculo",
    secondaryMarks: "Tatuajes",
    secondaryUlcers: "Úlceras",
    secondaryErythrosis: "Eritrosis",
    secondaryPustules: "Pústulas",
    secondaryScales: "Escamas",
    secondaryCysts: "Quistes",
  };

  const pigmentationLabels = {
    pigmentationMelasma: "Melasma",
    pigmentationLentigos: "Léntigos",
    pigmentationPostInflammatory: "Máculas Postinflamatorias",
    pigmentationAchromia: "Acromías",
    pigmentationVitiligo: "Vitíligo",
  };

  const vascularLabels = {
    vascularErythema: "Eritema",
    vascularErythrosis: "Eritrosis",
    vascularTelangiectasias: "Telangiectasias",
    vascularCouperose: "Cuperosis",
    vascularAngiomas: "Angiomas",
  };

  const agingLabels = {
    agingFurrows: "Surcos",
    agingWrinkles: "Arrugas",
    agingExpressionLines: "Líneas de expresión",
    agingFlaccidity: "Flacidez",
    agingAngiomas: "Angiomas",
  };

  const varicesLabels = {
    varicesSmall: "Pequeñas",
    varicesVisible: "Visibles",
    varicesEdema: "Edema",
    varicesUlcers: "Úlceras",
    varicesDiscoloration: "Coloración",
    varicesTelangiectasias: "Telangiectasias",
  };

  return (
    <div className="flex flex-col gap-4">
      {onEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => onEdit(assessment)}
            className="px-4 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-colors cursor-pointer"
          >
            Editar Expediente
          </button>
        </div>
      )}

      <Section title="General">
        <Field
          label="Fecha del servicio"
          value={formatServiceDate(assessment.serviceDate)}
        />
        <Field
          label="Fecha de captura en el sistema"
          value={formatCapturedAt(
            assessment.createdAt || assessment.created_at,
          )}
        />
        <Field
          label="Motivo de consulta"
          value={assessment.consultationReason}
        />
        <Field label="Cuándo comenzó" value={assessment.onsetDateDetails} />
        <Field label="Causa conocida" value={assessment.knownCause} />
        <Field label="Cuidados previos" value={assessment.previousCare} />
        <Field label="Tipo de sangre" value={assessment.bloodType} />
        <Field label="Tiempo radicando" value={assessment.residenceTime} />
        <Field label="Dónde nos conoció" value={assessment.referredMedia} />
        <Field
          label="Servicio realizado"
          value={
            assessment.service?.name ||
            assessment.appointment?.service?.name ||
            null
          }
        />
        <Field
          label="Atendido por"
          value={assessment.performedBy?.name || null}
        />
        <Field
          label="Temperatura"
          value={assessment.temperatureC && `${assessment.temperatureC} °C`}
        />
        <Field label="Presión arterial" value={assessment.bloodPressure} />
        <Field
          label="Oxigenación"
          value={
            assessment.oxygenSaturation && `${assessment.oxygenSaturation}%`
          }
        />
        <Field
          label="Frec. cardíaca"
          value={assessment.heartRateBpm && `${assessment.heartRateBpm} bpm`}
        />
        <Field
          label="Diagnóstico del profesional"
          value={assessment.professionalAssessment}
        />

        {assessment.professionalTreatments?.length > 0 && (
          <TagList
            label="Bajo tratamiento con"
            items={assessment.professionalTreatments.map((t) =>
              findLabel(PROFESSIONAL_TYPES, t.professionalType),
            )}
          />
        )}

        {assessment.gynecoRecord && (
          <>
            <Field
              label="Edad inicio periodo/menopausia"
              value={assessment.gynecoRecord.periodStartAge}
            />
            <Field
              label="Último periodo"
              value={assessment.gynecoRecord.lastPeriodDate}
            />
            <Field
              label="Tipo de periodo"
              value={
                PERIOD_TYPE_LABELS[assessment.gynecoRecord.periodType] ||
                assessment.gynecoRecord.periodType
              }
            />
            <Field
              label="Método anticonceptivo"
              value={assessment.gynecoRecord.contraceptiveMethod}
            />
          </>
        )}
      </Section>

      <Section title="Fotografías" defaultOpen={false}>
        <AssessmentPhotosGallery
          assessmentId={assessment.assessmentId}
          laserAssessmentId={assessment.laserAssessmentId}
        />
      </Section>

      {(assessment.lifestyleHabit || assessment.skincareRoutine) && (
        <Section title="Hábitos" defaultOpen={false}>
          {assessment.skincareRoutine && (
            <>
              <span className="text-sm font-bold text-primary">
                Rutina de Día
              </span>
              <Field
                label="Jabón / limpiador"
                value={assessment.skincareRoutine.dayCleanser}
              />
              <Field
                label="Hidratante de día"
                value={assessment.skincareRoutine.dayMoisturizer}
              />
              <Field
                label="Protector solar"
                value={assessment.skincareRoutine.daySunscreen}
              />
              <Field
                label="Suero / Exfoliante"
                value={assessment.skincareRoutine.dayExfoliator}
              />
              <Field
                label="Tónico"
                value={assessment.skincareRoutine.dayToner}
              />
              <Field
                label="Suero / Serum"
                value={assessment.skincareRoutine.daySerum}
              />
              <Field
                label="Otro (día)"
                value={assessment.skincareRoutine.dayOther}
              />

              <span className="text-sm font-bold text-primary mt-2">
                Rutina de Noche
              </span>
              <Field
                label="Jabón / limpiador"
                value={assessment.skincareRoutine.nightCleanser}
              />
              <Field
                label="Hidratante"
                value={assessment.skincareRoutine.nightMoisturizer}
              />
              <Field
                label="Tónico"
                value={assessment.skincareRoutine.nightToner}
              />
              <Field
                label="Crema de ojos"
                value={assessment.skincareRoutine.nightEyeCream}
              />
              <Field
                label="Desmaquillante"
                value={assessment.skincareRoutine.nightMakeupRemover}
              />
              <Field
                label="Suero / Exfoliante"
                value={assessment.skincareRoutine.nightExfoliator}
              />
              <Field
                label="Otro (noche)"
                value={assessment.skincareRoutine.nightOther}
              />
            </>
          )}
          <Field
            label="Frecuencia maquillaje"
            value={assessment.lifestyleHabit?.makeupFrequency}
          />
          <Field
            label="Frecuencia lavado sábanas"
            value={assessment.lifestyleHabit?.washingFrequency}
          />
          <Field
            label="Actividad física"
            value={assessment.lifestyleHabit?.physicalActivityDetails}
          />
          <Field
            label="Hora dormir"
            value={assessment.lifestyleHabit?.sleepTime}
          />
          <Field
            label="Hora despertar"
            value={assessment.lifestyleHabit?.wakeTime}
          />
          {assessment.lifestyleHabit && (
            <Field
              label="Nivel de estrés"
              value={`${assessment.lifestyleHabit.stressLevel} / 10`}
            />
          )}
          <Field
            label="Descripción del día"
            value={assessment.lifestyleHabit?.dayDescription}
          />

          {assessment.dietRatings?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-primary">
                Alimentación semanal
              </span>
              <div className="grid grid-cols-2 gap-1">
                {assessment.dietRatings.map((d) => (
                  <span key={d.foodItem} className="text-xs text-gray-600">
                    {findLabel(DIET_OPTIONS, d.foodItem)}: {d.ratingValue}/10
                  </span>
                ))}
              </div>
            </div>
          )}

          {assessment.skinPractices?.length > 0 && (
            <TagList
              label="Prácticas realizadas"
              items={assessment.skinPractices.map((p) =>
                findLabel(SKIN_PRACTICES, p.substanceType),
              )}
            />
          )}
        </Section>
      )}

      {(assessment.medicalBackground || assessment.allergiesRecord) && (
        <Section title="Padecimientos" defaultOpen={false}>
          <TagList
            label="Antecedentes médicos"
            items={booleanTags(assessment.medicalBackground, backgroundLabels)}
          />
          <Field
            label="Observaciones médicas"
            value={assessment.medicalBackground?.medicalObservations}
          />
          <TagList
            label="Alergias / afecciones"
            items={booleanTags(assessment.allergiesRecord, allergyLabels)}
          />
          <Field
            label="Detalles de alergias"
            value={assessment.allergiesRecord?.allergyDetails}
          />
        </Section>
      )}

      {assessment.bodyEvaluation && (
        <Section title="Corporal" defaultOpen={false}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Field
              label="Peso"
              value={
                assessment.bodyEvaluation.weightKg &&
                `${assessment.bodyEvaluation.weightKg} kg`
              }
            />
            <Field
              label="Talla"
              value={
                assessment.bodyEvaluation.heightCm &&
                `${assessment.bodyEvaluation.heightCm} m`
              }
            />
            <Field
              label="Cintura"
              value={
                assessment.bodyEvaluation.waistCm &&
                `${assessment.bodyEvaluation.waistCm} cm`
              }
            />
            <Field
              label="Abdomen"
              value={
                assessment.bodyEvaluation.abdomenCm &&
                `${assessment.bodyEvaluation.abdomenCm} cm`
              }
            />
            <Field
              label="Cadera"
              value={
                assessment.bodyEvaluation.hipCm &&
                `${assessment.bodyEvaluation.hipCm} cm`
              }
            />
            <Field
              label="Brazos"
              value={
                assessment.bodyEvaluation.armsCm &&
                `${assessment.bodyEvaluation.armsCm} cm`
              }
            />
            <Field
              label="Pierna"
              value={
                assessment.bodyEvaluation.legCm &&
                `${assessment.bodyEvaluation.legCm} cm`
              }
            />
            <Field label="IMC" value={assessment.bodyEvaluation.bmi} />
          </div>
          <TagList
            label="Adiposidades localizadas"
            items={zoneTags(assessment.bodyEvaluation, "fat")}
          />
          <TagList
            label="Celulitis"
            items={zoneTags(assessment.bodyEvaluation, "cellulite")}
          />
          <Field
            label="Textura celulitis"
            value={assessment.bodyEvaluation.celluliteTexture}
          />
          <Field
            label="Grado celulitis"
            value={assessment.bodyEvaluation.celluliteGrade}
          />
          <TagList
            label="Estrías"
            items={zoneTags(assessment.bodyEvaluation, "stretchmarks")}
          />
          <TagList
            label="Varices"
            items={booleanTags(assessment.bodyEvaluation, varicesLabels)}
          />
          <Field
            label="Diagnóstico corporal"
            value={assessment.bodyEvaluation.bodyDiagnosis}
          />
        </Section>
      )}

      {assessment.facialEvaluation && (
        <Section title="Facial" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field
              label="Edad de la piel"
              value={assessment.facialEvaluation.skinAge}
            />
            <Field
              label="Tipo de secreción"
              value={assessment.facialEvaluation.secretionType}
            />
            <Field
              label="Fototipo"
              value={assessment.facialEvaluation.phototype}
            />
          </div>
          <TagList
            label="Afección"
            items={booleanTags(assessment.facialEvaluation, facialLabels)}
          />
          <TagList
            label="Alteraciones primarias"
            items={booleanTags(assessment.facialEvaluation, primaryLabels)}
          />
          <TagList
            label="Alteraciones secundarias"
            items={booleanTags(assessment.facialEvaluation, secondaryLabels)}
          />
          <TagList
            label="Pigmentación"
            items={booleanTags(assessment.facialEvaluation, pigmentationLabels)}
          />
          <Field
            label="Pigmentación (otros)"
            value={assessment.facialEvaluation.pigmentationOther}
          />
          <TagList
            label="Vascularización"
            items={booleanTags(assessment.facialEvaluation, vascularLabels)}
          />
          <Field
            label="Vascularización (otros)"
            value={assessment.facialEvaluation.vascularOther}
          />
          <TagList
            label="Envejecimiento"
            items={booleanTags(assessment.facialEvaluation, agingLabels)}
          />
          <Field
            label="Envejecimiento (otros)"
            value={assessment.facialEvaluation.agingOther}
          />
          <Field
            label="Escala Glogau"
            value={assessment.facialEvaluation.glogauScale}
          />
          <Field
            label="Observaciones Glogau"
            value={assessment.facialEvaluation.glogauObservations}
          />
          <Field
            label="Notas faciales"
            value={assessment.facialEvaluation.facialNotes}
          />
        </Section>
      )}
    </div>
  );
};

export default AssessmentSummaryView;
