import sequelize from "../config/db.js";
import MedicalAssessment from "../models/MedicalAssessment.js";
import AssessmentProfessionalTreatment from "../models/AssessmentProfessionalTreatment.js";
import GynecoObstetricRecord from "../models/GynecoObstetricRecord.js";
import ObstetricHistoryDetail from "../models/ObstetricHistoryDetail.js";
import DailySkincareRoutine from "../models/DailySkincareRoutine.js";
import LifestyleHabit from "../models/LifestyleHabit.js";
import PatientDietRating from "../models/PatientDietRating.js";
import PatientSkinPractice from "../models/PatientSkinPractice.js";
import PatientMedicalBackground from "../models/PatientMedicalBackground.js";
import PatientAllergiesRecord from "../models/PatientAllergiesRecord.js";
import BodyEvaluation from "../models/BodyEvaluation.js";
import FacialEvaluation from "../models/FacialEvaluation.js";
import AssessmentSessionNote from "../models/AssessmentSessionNote.js";
import AssessmentPackageSnapshot from "../models/AssessmentPackageSnapshot.js";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import { sanitizeEmptyStrings } from "../utils/sanitize.js";
import { createPendingPhotosForAssessment } from "./assessmentPhotoController.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import PackageSession from "../models/PackageSession.js";
import CustomerPackage from "../models/CustomerPackage.js";

const fullIncludes = [
  { model: AssessmentProfessionalTreatment, as: "professionalTreatments" },
  {
    model: GynecoObstetricRecord,
    as: "gynecoRecord",
    include: [{ model: ObstetricHistoryDetail, as: "obstetricDetails" }],
  },
  { model: DailySkincareRoutine, as: "skincareRoutine" },
  { model: LifestyleHabit, as: "lifestyleHabit" },
  { model: PatientDietRating, as: "dietRatings" },
  { model: PatientSkinPractice, as: "skinPractices" },
  { model: PatientMedicalBackground, as: "medicalBackground" },
  { model: PatientAllergiesRecord, as: "allergiesRecord" },
  { model: BodyEvaluation, as: "bodyEvaluation" },
  { model: FacialEvaluation, as: "facialEvaluation" },
  {
    model: AssessmentSessionNote,
    as: "sessionNotes",
    separate: true,
    order: [
      ["noteDate", "DESC"],
      ["noteId", "DESC"],
    ],
  },
  { model: Service, as: "service", attributes: ["serviceId", "name", "brand"] },
  { model: User, as: "performedBy", attributes: ["id", "name"] },
];

const allowedReferredMedia = [
  "Instagram",
  "Facebook",
  "TikTok",
  "Recomendacion",
  "Por su cuenta",
  "Otro",
];

const allowedPeriodTypes = ["Regular", "Irregular", "Colicos", "Antojos"];

// Campos comparables para la tabla de resultados de un paquete completado.
// Solo estos se incluyen en el snapshot de línea base / final.
const buildComparableSnapshot = ({ bodyEvaluation, facialEvaluation }) => {
  const body = bodyEvaluation
    ? {
        weightKg: bodyEvaluation.weightKg,
        heightCm: bodyEvaluation.heightCm,
        bmi: bodyEvaluation.bmi,
        waistCm: bodyEvaluation.waistCm,
        abdomenCm: bodyEvaluation.abdomenCm,
        hipCm: bodyEvaluation.hipCm,
        armsCm: bodyEvaluation.armsCm,
        legCm: bodyEvaluation.legCm,
        bicipitalFoldMm: bodyEvaluation.bicipitalFoldMm,
        tricipitalFoldMm: bodyEvaluation.tricipitalFoldMm,
        abdominalFoldMm: bodyEvaluation.abdominalFoldMm,
        subiliacFoldMm: bodyEvaluation.subiliacFoldMm,
        crestFoldMm: bodyEvaluation.crestFoldMm,
        scapularFoldMm: bodyEvaluation.scapularFoldMm,
        thighFoldMm: bodyEvaluation.thighFoldMm,
        celluliteTexture: bodyEvaluation.celluliteTexture,
        celluliteGrade: bodyEvaluation.celluliteGrade,
        fatZones: Object.keys(bodyEvaluation)
          .filter((k) => k.startsWith("fat") && bodyEvaluation[k] === true)
          .map((k) => k),
        celluliteZones: Object.keys(bodyEvaluation)
          .filter(
            (k) => k.startsWith("cellulite") && bodyEvaluation[k] === true,
          )
          .map((k) => k),
        stretchmarksZones: Object.keys(bodyEvaluation)
          .filter(
            (k) => k.startsWith("stretchmarks") && bodyEvaluation[k] === true,
          )
          .map((k) => k),
      }
    : null;

  const facial = facialEvaluation
    ? {
        phototype: facialEvaluation.phototype,
        glogauScale: facialEvaluation.glogauScale,
        affections: Object.keys(facialEvaluation)
          .filter(
            (k) => k.startsWith("affection") && facialEvaluation[k] === true,
          )
          .map((k) => k),
        primaryAlterations: Object.keys(facialEvaluation)
          .filter(
            (k) => k.startsWith("primary") && facialEvaluation[k] === true,
          )
          .map((k) => k),
        secondaryAlterations: Object.keys(facialEvaluation)
          .filter(
            (k) => k.startsWith("secondary") && facialEvaluation[k] === true,
          )
          .map((k) => k),
        pigmentation: Object.keys(facialEvaluation)
          .filter(
            (k) => k.startsWith("pigmentation") && facialEvaluation[k] === true,
          )
          .map((k) => k),
        vascular: Object.keys(facialEvaluation)
          .filter(
            (k) => k.startsWith("vascular") && facialEvaluation[k] === true,
          )
          .map((k) => k),
        aging: Object.keys(facialEvaluation)
          .filter((k) => k.startsWith("aging") && facialEvaluation[k] === true)
          .map((k) => k),
      }
    : null;

  return { body, facial };
};

// Obtiene el expediente vivo (más reciente) de un cliente para un servicio
export const getAssessmentByCustomerAndService = async (req, res) => {
  try {
    const { customerId, serviceId } = req.params;

    const assessment = await MedicalAssessment.findOne({
      where: { customerId, serviceId, isHidden: false },
      include: fullIncludes,
    });

    res.status(200).json(assessment || null);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching assessment",
      error: error.message,
    });
  }
};

// Lista los servicios (Modelha DK + Depilclinik) que un cliente ha tenido
// con expediente, para la vista de "Servicios del cliente"
export const getCustomerServiceSummaries = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessments = await MedicalAssessment.findAll({
      where: { customerId, isHidden: false },
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["serviceId", "name", "brand"],
        },
      ],
      attributes: [
        "assessmentId",
        "serviceId",
        "serviceDate",
        "activePackageId",
      ],
    });

    const withPackageStatus = await Promise.all(
      assessments.map(async (a) => {
        let packageStatus = null;
        if (a.activePackageId) {
          const pkg = await CustomerPackage.findByPk(a.activePackageId, {
            attributes: [
              "packageId",
              "status",
              "totalSessions",
              "sessionsCompleted",
            ],
          });
          if (pkg) {
            packageStatus = {
              packageId: pkg.packageId,
              status: pkg.status,
              totalSessions: pkg.totalSessions,
              sessionsCompleted: pkg.sessionsCompleted,
            };
          }
        }
        return {
          type: "medical",
          assessmentId: a.assessmentId,
          serviceId: a.serviceId,
          serviceName: a.service?.name,
          brand: a.service?.brand,
          serviceDate: a.serviceDate,
          packageStatus,
        };
      }),
    );

    res.status(200).json(withPackageStatus);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching customer service summaries",
      error: error.message,
    });
  }
};

// Obtiene el expediente ligado a una cita específica (para que el
// colaborador lo llene). req.appointment ya viene validado por
// canAttendAppointment. Si el cliente ya tiene expediente de ese
// servicio, se precarga en vez de mostrar el formulario vacío.
export const getAssessmentByAppointment = async (req, res) => {
  try {
    const appointment = req.appointment;

    let assessment = await MedicalAssessment.findOne({
      where: {
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
        isHidden: false,
      },
      include: fullIncludes,
    });

    let isExactMatch = Boolean(assessment);

    // Si el cliente nunca ha tenido este servicio, buscamos si tiene
    // algún otro expediente de la misma marca para precargar los datos
    // generales (hábitos, antecedentes, alergias, etc.). Las notas de
    // sesión nunca se copian: son exclusivas de cada servicio.
    if (!assessment) {
      const otherAssessment = await MedicalAssessment.findOne({
        where: {
          customerId: appointment.customerId,
          isHidden: false,
        },
        include: fullIncludes,
        order: [["filled_at", "DESC"]],
      });

      if (otherAssessment) {
        assessment = otherAssessment.toJSON();
        assessment.sessionNotes = [];
      }
    }

    const customer = await Customer.findByPk(appointment.customerId);

    res.status(200).json({
      assessment: assessment || null,
      isExactMatch,
      appointment: {
        appointmentId: appointment.appointmentId,
        isNewClientPendingData: appointment.isNewClientPendingData,
      },
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching assessment for appointment",
      error: error.message,
    });
  }
};

// Crea o actualiza el expediente vivo de (customerId, serviceId) al
// atender una cita. Reemplaza al viejo createAssessment.
export const createOrUpdateAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const appointment = req.appointment;

    const sanitizedBody = sanitizeEmptyStrings(req.body);
    const {
      general,
      professionalTreatments,
      gynecoRecord,
      obstetricDetails,
      skincareRoutine,
      lifestyleHabit,
      dietRatings,
      skinPractices,
      medicalBackground,
      allergiesRecord,
      bodyEvaluation,
      facialEvaluation,
      sessionNote,
    } = sanitizedBody;

    if (!general || !general.consultationReason || !general.referredMedia) {
      await t.rollback();
      return res.status(400).json({
        message:
          "El motivo de consulta y el medio de referencia son obligatorios",
      });
    }

    if (!allowedReferredMedia.includes(general.referredMedia)) {
      await t.rollback();
      return res.status(400).json({
        message: `Medio de referencia inválido: ${general.referredMedia}`,
      });
    }

    if (!sessionNote || !sessionNote.trim()) {
      await t.rollback();
      return res.status(400).json({
        message: "La nota de esta sesión es obligatoria para poder guardar",
      });
    }

    if (gynecoRecord) {
      const safeGynecoRecord = {
        ...gynecoRecord,
        periodType: gynecoRecord.periodType?.trim() || null,
      };
      if (
        safeGynecoRecord.periodType &&
        !allowedPeriodTypes.includes(safeGynecoRecord.periodType)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: `Tipo de periodo inválido: ${safeGynecoRecord.periodType}`,
        });
      }
    }

    const isCollaborator = req.user.role !== "Administrador";

    // ¿Ya existe un expediente vivo de este cliente para este servicio?
    let assessment = await MedicalAssessment.findOne({
      where: {
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
      },
      transaction: t,
    });

    // ¿Esta cita pertenece a una sesión de paquete?
    const packageSession = await PackageSession.findOne({
      where: { appointmentId: appointment.appointmentId },
      transaction: t,
    });

    const basePayload = {
      customerId: appointment.customerId,
      appointmentId: appointment.appointmentId,
      serviceId: appointment.serviceId,
      serviceDate: appointment.startTime,
      activePackageId: packageSession ? packageSession.packageId : null,
      ...general,
      filledByUserId: req.user.id,
      filledAt: new Date(),
      lockedForCollaborator: isCollaborator,
      isHidden: false,
    };

    const isFirstSessionOfNewPackage =
      packageSession &&
      packageSession.sessionNumber === 1 &&
      (!assessment || assessment.activePackageId !== packageSession.packageId);

    if (assessment) {
      await assessment.update(basePayload, { transaction: t });
    } else {
      assessment = await MedicalAssessment.create(basePayload, {
        transaction: t,
      });
    }

    // --- Sub-tablas: reemplazamos el contenido cada vez que se guarda ---

    await AssessmentProfessionalTreatment.destroy({
      where: { assessmentId: assessment.assessmentId },
      transaction: t,
    });
    if (professionalTreatments?.length > 0) {
      await AssessmentProfessionalTreatment.bulkCreate(
        professionalTreatments.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    if (gynecoRecord) {
      const safeGynecoRecord = {
        ...gynecoRecord,
        periodType: gynecoRecord.periodType?.trim() || null,
      };
      const existingGyneco = await GynecoObstetricRecord.findOne({
        where: { assessmentId: assessment.assessmentId },
        transaction: t,
      });
      let gynecoRow;
      if (existingGyneco) {
        await existingGyneco.update(safeGynecoRecord, { transaction: t });
        gynecoRow = existingGyneco;
      } else {
        gynecoRow = await GynecoObstetricRecord.create(
          { ...safeGynecoRecord, assessmentId: assessment.assessmentId },
          { transaction: t },
        );
      }
      await ObstetricHistoryDetail.destroy({
        where: { gynecoId: gynecoRow.gynecoId },
        transaction: t,
      });
      if (obstetricDetails?.length > 0) {
        await ObstetricHistoryDetail.bulkCreate(
          obstetricDetails.map((item) => ({
            ...item,
            gynecoId: gynecoRow.gynecoId,
          })),
          { transaction: t },
        );
      }
    }

    const upsertOneToOne = async (Model, data) => {
      if (!data) return;
      const existingRow = await Model.findOne({
        where: { assessmentId: assessment.assessmentId },
        transaction: t,
      });
      if (existingRow) {
        await existingRow.update(data, { transaction: t });
      } else {
        await Model.create(
          { ...data, assessmentId: assessment.assessmentId },
          { transaction: t },
        );
      }
    };

    await upsertOneToOne(DailySkincareRoutine, skincareRoutine);

    if (lifestyleHabit) {
      lifestyleHabit.dayDescription = lifestyleHabit.dayDescription ?? "";
      await upsertOneToOne(LifestyleHabit, lifestyleHabit);
    }

    await PatientDietRating.destroy({
      where: { assessmentId: assessment.assessmentId },
      transaction: t,
    });
    if (dietRatings?.length > 0) {
      await PatientDietRating.bulkCreate(
        dietRatings.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    await PatientSkinPractice.destroy({
      where: { assessmentId: assessment.assessmentId },
      transaction: t,
    });
    if (skinPractices?.length > 0) {
      await PatientSkinPractice.bulkCreate(
        skinPractices.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    await upsertOneToOne(PatientMedicalBackground, medicalBackground);
    await upsertOneToOne(PatientAllergiesRecord, allergiesRecord);
    await upsertOneToOne(BodyEvaluation, bodyEvaluation);

    if (facialEvaluation) {
      const sanitizedFacial = {
        ...facialEvaluation,
        glogauScale: facialEvaluation.glogauScale || null,
        glogauObservations: facialEvaluation.glogauObservations || null,
      };
      await upsertOneToOne(FacialEvaluation, sanitizedFacial);
    }

    // --- Nota de sesión obligatoria, con la fecha real de la cita ---
    await AssessmentSessionNote.create(
      {
        assessmentId: assessment.assessmentId,
        noteDate: appointment.startTime,
        noteText: sessionNote.trim(),
        createdByUserId: req.user.id,
        packageId: packageSession ? packageSession.packageId : null,
        sessionNumber: packageSession ? packageSession.sessionNumber : null,
      },
      { transaction: t },
    );

    // --- Línea base del paquete (solo si es la primera sesión de un
    // paquete recién iniciado para este servicio) ---
    if (isFirstSessionOfNewPackage) {
      const freshBody = bodyEvaluation
        ? await BodyEvaluation.findOne({
            where: { assessmentId: assessment.assessmentId },
            transaction: t,
          })
        : null;
      const freshFacial = facialEvaluation
        ? await FacialEvaluation.findOne({
            where: { assessmentId: assessment.assessmentId },
            transaction: t,
          })
        : null;

      const snapshotData = buildComparableSnapshot({
        bodyEvaluation: freshBody?.toJSON(),
        facialEvaluation: freshFacial?.toJSON(),
      });

      await AssessmentPackageSnapshot.destroy({
        where: {
          packageId: packageSession.packageId,
          snapshotType: "Baseline",
        },
        transaction: t,
      });
      await AssessmentPackageSnapshot.create(
        {
          assessmentId: assessment.assessmentId,
          packageId: packageSession.packageId,
          snapshotType: "Baseline",
          snapshotData,
        },
        { transaction: t },
      );
    }

    if (appointment.isNewClientPendingData) {
      await Appointment.update(
        { isNewClientPendingData: false },
        {
          where: { appointmentId: appointment.appointmentId },
          transaction: t,
        },
      );
    }

    await createPendingPhotosForAssessment(
      { assessmentId: assessment.assessmentId },
      t,
    );

    let checkoutNeeded = false;
    if (
      appointment.status !== "Cancelada" &&
      appointment.status !== "Completada"
    ) {
      await Appointment.update(
        { status: "Completada" },
        {
          where: { appointmentId: appointment.appointmentId },
          transaction: t,
        },
      );
      // syncPackageSessionOnCompletion se importa aquí para evitar un
      // ciclo de imports con packageController.
      const { syncPackageSessionOnCompletion } =
        await import("./packageController.js");
      await syncPackageSessionOnCompletion(appointment.appointmentId, t);
      checkoutNeeded = !packageSession;
    }

    await t.commit();

    const fullAssessment = await MedicalAssessment.findByPk(
      assessment.assessmentId,
      { include: fullIncludes },
    );

    res.status(201).json({ assessment: fullAssessment, checkoutNeeded });
  } catch (error) {
    await t.rollback();
    console.error("Error saving assessment:", error);
    res.status(500).json({
      message: "Server error while saving assessment",
      error: error.message,
    });
  }
};

// Comparación de línea base vs. resultado final de un paquete completado
export const getPackageComparison = async (req, res) => {
  try {
    const { packageId } = req.params;

    const baseline = await AssessmentPackageSnapshot.findOne({
      where: { packageId, snapshotType: "Baseline" },
    });
    const final = await AssessmentPackageSnapshot.findOne({
      where: { packageId, snapshotType: "Final" },
    });

    if (!baseline && !final) {
      return res.status(404).json({
        message: "No hay datos de comparación registrados para este paquete",
      });
    }

    res.status(200).json({
      baseline: baseline?.snapshotData || null,
      final: final?.snapshotData || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching package comparison",
      error: error.message,
    });
  }
};

// Edición manual del expediente vivo, sin necesidad de una cita —
// solo para corregir datos de captura. No agrega nota de sesión ni
// toca snapshots de paquete (eso es exclusivo del flujo de atender cita).
export const updateAssessmentManually = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const existing = await MedicalAssessment.findByPk(id, { transaction: t });

    if (!existing) {
      await t.rollback();
      return res.status(404).json({ message: "Expediente no encontrado" });
    }

    const sanitizedBody = sanitizeEmptyStrings(req.body);
    const {
      general,
      professionalTreatments,
      gynecoRecord,
      obstetricDetails,
      skincareRoutine,
      lifestyleHabit,
      dietRatings,
      skinPractices,
      medicalBackground,
      allergiesRecord,
      bodyEvaluation,
      facialEvaluation,
    } = sanitizedBody;

    if (
      general?.referredMedia &&
      !allowedReferredMedia.includes(general.referredMedia)
    ) {
      await t.rollback();
      return res.status(400).json({
        message: `Medio de referencia inválido: ${general.referredMedia}`,
      });
    }

    if (gynecoRecord?.periodType) {
      const cleanPeriodType = gynecoRecord.periodType.trim();
      if (!allowedPeriodTypes.includes(cleanPeriodType)) {
        await t.rollback();
        return res.status(400).json({
          message: `Tipo de periodo inválido: ${cleanPeriodType}`,
        });
      }
      gynecoRecord.periodType = cleanPeriodType;
    }

    await existing.update({ ...(general || {}) }, { transaction: t });

    if (professionalTreatments) {
      await AssessmentProfessionalTreatment.destroy({
        where: { assessmentId: id },
        transaction: t,
      });
      if (professionalTreatments.length > 0) {
        await AssessmentProfessionalTreatment.bulkCreate(
          professionalTreatments.map((item) => ({
            ...item,
            assessmentId: id,
          })),
          { transaction: t },
        );
      }
    }

    if (gynecoRecord) {
      const existingGyneco = await GynecoObstetricRecord.findOne({
        where: { assessmentId: id },
        transaction: t,
      });
      let gynecoRow;
      if (existingGyneco) {
        await existingGyneco.update(gynecoRecord, { transaction: t });
        gynecoRow = existingGyneco;
      } else {
        gynecoRow = await GynecoObstetricRecord.create(
          { ...gynecoRecord, assessmentId: id },
          { transaction: t },
        );
      }
      if (obstetricDetails) {
        await ObstetricHistoryDetail.destroy({
          where: { gynecoId: gynecoRow.gynecoId },
          transaction: t,
        });
        if (obstetricDetails.length > 0) {
          await ObstetricHistoryDetail.bulkCreate(
            obstetricDetails.map((item) => ({
              ...item,
              gynecoId: gynecoRow.gynecoId,
            })),
            { transaction: t },
          );
        }
      }
    }

    const upsertOneToOne = async (Model, data) => {
      if (!data) return;
      const existingRow = await Model.findOne({
        where: { assessmentId: id },
        transaction: t,
      });
      if (existingRow) {
        await existingRow.update(data, { transaction: t });
      } else {
        await Model.create({ ...data, assessmentId: id }, { transaction: t });
      }
    };

    await upsertOneToOne(DailySkincareRoutine, skincareRoutine);

    if (lifestyleHabit) {
      lifestyleHabit.dayDescription = lifestyleHabit.dayDescription ?? "";
      await upsertOneToOne(LifestyleHabit, lifestyleHabit);
    }

    if (dietRatings) {
      await PatientDietRating.destroy({
        where: { assessmentId: id },
        transaction: t,
      });
      if (dietRatings.length > 0) {
        await PatientDietRating.bulkCreate(
          dietRatings.map((item) => ({ ...item, assessmentId: id })),
          { transaction: t },
        );
      }
    }

    if (skinPractices) {
      await PatientSkinPractice.destroy({
        where: { assessmentId: id },
        transaction: t,
      });
      if (skinPractices.length > 0) {
        await PatientSkinPractice.bulkCreate(
          skinPractices.map((item) => ({ ...item, assessmentId: id })),
          { transaction: t },
        );
      }
    }

    await upsertOneToOne(PatientMedicalBackground, medicalBackground);
    await upsertOneToOne(PatientAllergiesRecord, allergiesRecord);
    await upsertOneToOne(BodyEvaluation, bodyEvaluation);

    if (facialEvaluation) {
      const sanitizedFacial = {
        ...facialEvaluation,
        glogauScale: facialEvaluation.glogauScale || null,
        glogauObservations: facialEvaluation.glogauObservations || null,
      };
      await upsertOneToOne(FacialEvaluation, sanitizedFacial);
    }

    await t.commit();

    const fullAssessment = await MedicalAssessment.findByPk(id, {
      include: fullIncludes,
    });

    res.status(200).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error updating assessment manually:", error);
    res.status(500).json({
      message: "Server error while updating assessment",
      error: error.message,
    });
  }
};

export { buildComparableSnapshot };
