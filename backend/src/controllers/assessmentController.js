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
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import { sanitizeEmptyStrings } from "../utils/sanitize.js";
import { createPendingPhotosForAssessment } from "./assessmentPhotoController.js";
import { syncPackageSessionOnCompletion } from "./packageController.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { Op } from "sequelize";

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
    model: Appointment,
    as: "appointment",
    attributes: ["appointmentId", "startTime", "status"],
    required: false,
    include: [
      {
        model: Service,
        as: "service",
        attributes: ["serviceId", "name", "brand"],
      },
    ],
  },
  { model: Service, as: "service", attributes: ["serviceId", "name", "brand"] },
  { model: User, as: "performedBy", attributes: ["id", "name"] },
];

// Obtiene el expediente más reciente de un cliente (para CustomersPage)
export const getLatestAssessmentByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessment = await MedicalAssessment.findOne({
      where: { customerId, isHidden: false },
      include: fullIncludes,
      order: [["service_date", "DESC"]],
    });

    if (!assessment) {
      return res
        .status(404)
        .json({ message: "Este cliente aún no tiene expedientes registrados" });
    }

    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching latest assessment",
      error: error.message,
    });
  }
};

// Historial completo de un cliente (solo Administrador, validado en la ruta)
export const getAssessmentHistoryByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessments = await MedicalAssessment.findAll({
      where: { customerId, isHidden: false },
      include: fullIncludes,
      order: [["service_date", "DESC"]],
    });

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching assessment history",
      error: error.message,
    });
  }
};

// Obtiene el expediente ligado a una cita específica (para que el colaborador
// lo llene). req.appointment ya viene validado por canAttendAppointment.
export const getAssessmentByAppointment = async (req, res) => {
  try {
    const appointment = req.appointment;

    let assessment = await MedicalAssessment.findOne({
      where: { appointmentId: appointment.appointmentId },
      include: fullIncludes,
    });

    const customer = await Customer.findByPk(appointment.customerId);

    res.status(200).json({
      assessment: assessment || null,
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

// Crea el expediente completo de una sesión (todas las pestañas a la vez)
export const createAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const appointment = req.appointment;

    // Evita duplicar el expediente si la cita ya tiene uno registrado
    // (por ejemplo, si la administradora atiende una cita que el
    // colaborador ya había llenado, o si se reintenta el envío).
    const existingForAppointment = await MedicalAssessment.findOne({
      where: { appointmentId: appointment.appointmentId },
      transaction: t,
    });

    if (existingForAppointment) {
      await t.rollback();
      return res.status(400).json({
        message: "Esta cita ya tiene un expediente clínico registrado",
      });
    }

    // Saneamos TODO el body de entrada: cualquier "" se vuelve null antes
    // de tocar la base de datos, para no romper columnas ENUM (periodType,
    // bloodType, etc.) ni otros campos opcionales.
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

    const allowedReferredMedia = [
      "Instagram",
      "Facebook",
      "TikTok",
      "Recomendacion",
      "Por su cuenta",
      "Otro",
    ];

    const allowedPeriodTypes = ["Regular", "Irregular", "Cólicos", "Antojos"];

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

    const isCollaborator = req.user.role !== "Administrador";

    const assessment = await MedicalAssessment.create(
      {
        customerId: appointment.customerId,
        appointmentId: appointment.appointmentId,
        serviceDate: appointment.startTime,
        ...general,
        // Se registra siempre quién llenó el expediente (colaborador o
        // administrador), para dejar trazabilidad de quién atendió la
        // sesión aunque no sea el colaborador originalmente asignado.
        filledByUserId: req.user.id,
        filledAt: new Date(),
        lockedForCollaborator: isCollaborator,
      },
      { transaction: t },
    );

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

      if (safeGynecoRecord.periodType) {
        const periodType = safeGynecoRecord.periodType;
        const codePoints = Array.from(periodType).map((char) =>
          char.codePointAt(0),
        );
        console.log("GYNECO PERIOD TYPE DEBUG", {
          periodType,
          json: JSON.stringify(periodType),
          length: periodType.length,
          codePoints,
          inAllowed: allowedPeriodTypes.includes(periodType),
          allowedPeriodTypes,
        });
      }

      if (
        safeGynecoRecord.periodType &&
        !allowedPeriodTypes.includes(safeGynecoRecord.periodType)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: `Tipo de periodo inválido: ${safeGynecoRecord.periodType}`,
        });
      }

      const createdGyneco = await GynecoObstetricRecord.create(
        { ...safeGynecoRecord, assessmentId: assessment.assessmentId },
        { transaction: t },
      );

      if (obstetricDetails?.length > 0) {
        await ObstetricHistoryDetail.bulkCreate(
          obstetricDetails.map((item) => ({
            ...item,
            gynecoId: createdGyneco.gynecoId,
          })),
          { transaction: t },
        );
      }
    }

    if (skincareRoutine) {
      await DailySkincareRoutine.create(
        { ...skincareRoutine, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (lifestyleHabit) {
      // day_description es TEXT NOT NULL en la BD; aunque el saneamiento
      // global convierta "" en null para campos opcionales/ENUM, aquí
      // debemos preservar "" como valor válido para no violar la restricción.
      lifestyleHabit.dayDescription = lifestyleHabit.dayDescription ?? "";

      await LifestyleHabit.create(
        { ...lifestyleHabit, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (dietRatings?.length > 0) {
      await PatientDietRating.bulkCreate(
        dietRatings.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    if (skinPractices?.length > 0) {
      await PatientSkinPractice.bulkCreate(
        skinPractices.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    if (medicalBackground) {
      await PatientMedicalBackground.create(
        { ...medicalBackground, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (allergiesRecord) {
      await PatientAllergiesRecord.create(
        { ...allergiesRecord, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (bodyEvaluation) {
      await BodyEvaluation.create(
        { ...bodyEvaluation, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (facialEvaluation) {
      const sanitizedFacial = {
        ...facialEvaluation,
        glogauScale: facialEvaluation.glogauScale || null,
        glogauObservations: facialEvaluation.glogauObservations || null,
      };

      await FacialEvaluation.create(
        { ...sanitizedFacial, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (appointment.isNewClientPendingData) {
      await Appointment.update(
        { isNewClientPendingData: false },
        { where: { appointmentId: appointment.appointmentId }, transaction: t },
      );
    }

    await createPendingPhotosForAssessment(
      { assessmentId: assessment.assessmentId },
      t,
    );

    if (
      appointment.status !== "Cancelada" &&
      appointment.status !== "Completada"
    ) {
      await Appointment.update(
        { status: "Completada" },
        { where: { appointmentId: appointment.appointmentId }, transaction: t },
      );
      await syncPackageSessionOnCompletion(appointment.appointmentId, t);
    }

    await t.commit();

    const fullAssessment = await MedicalAssessment.findByPk(
      assessment.assessmentId,
      { include: fullIncludes },
    );

    res.status(201).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error creating assessment:", error);
    res.status(500).json({
      message: "Server error while creating assessment",
      error: error.message,
    });
  }
};

export const getAllAssessments = async (req, res) => {
  try {
    const assessments = await MedicalAssessment.findAll({
      where: { isHidden: false },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "phone"],
          where: { isHidden: false },
        },
      ],
      order: [[sequelize.col("service_date"), "DESC"]],
    });

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching all assessments",
      error: error.message,
    });
  }
};

export const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await MedicalAssessment.findByPk(id, {
      include: [
        ...fullIncludes,
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "phone"],
        },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ message: "Expediente no encontrado" });
    }

    res.status(200).json(assessment);
  } catch (error) {
    console.error("Error al obtener expediente por ID:", error);
    res.status(500).json({
      message: "Error al obtener el expediente detallado",
      error: error.message,
    });
  }
};

export const createHistoricalAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { customerId, serviceId, performedByUserId, assessmentDate } =
      req.body;

    if (!customerId || !serviceId || !assessmentDate) {
      await t.rollback();
      return res.status(400).json({
        message: "Cliente, servicio y fecha de la revisión son obligatorios",
      });
    }

    const parsedDate = new Date(`${assessmentDate}T00:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(parsedDate.getTime()) || parsedDate > today) {
      await t.rollback();
      return res.status(400).json({
        message: "La fecha no puede ser posterior al día de hoy",
      });
    }

    const service = await Service.findOne({
      where: { serviceId, isActive: true },
      transaction: t,
    });
    if (!service) {
      await t.rollback();
      return res.status(400).json({
        message: "El servicio seleccionado no es válido o está inactivo",
      });
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

    const allowedReferredMedia = [
      "Instagram",
      "Facebook",
      "TikTok",
      "Recomendacion",
      "Por su cuenta",
      "Otro",
    ];

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

    const assessment = await MedicalAssessment.create(
      {
        customerId,
        appointmentId: null,
        serviceId,
        performedByUserId: performedByUserId || null,
        serviceDate: assessmentDate,
        ...general,
        filledByUserId: req.user.id,
        filledAt: new Date(),
        lockedForCollaborator: false,
      },
      { transaction: t },
    );

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
      const createdGyneco = await GynecoObstetricRecord.create(
        { ...gynecoRecord, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
      if (obstetricDetails?.length > 0) {
        await ObstetricHistoryDetail.bulkCreate(
          obstetricDetails.map((item) => ({
            ...item,
            gynecoId: createdGyneco.gynecoId,
          })),
          { transaction: t },
        );
      }
    }

    if (skincareRoutine) {
      await DailySkincareRoutine.create(
        { ...skincareRoutine, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (lifestyleHabit) {
      lifestyleHabit.dayDescription = lifestyleHabit.dayDescription ?? "";
      await LifestyleHabit.create(
        { ...lifestyleHabit, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (dietRatings?.length > 0) {
      await PatientDietRating.bulkCreate(
        dietRatings.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    if (skinPractices?.length > 0) {
      await PatientSkinPractice.bulkCreate(
        skinPractices.map((item) => ({
          ...item,
          assessmentId: assessment.assessmentId,
        })),
        { transaction: t },
      );
    }

    if (medicalBackground) {
      await PatientMedicalBackground.create(
        { ...medicalBackground, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (allergiesRecord) {
      await PatientAllergiesRecord.create(
        { ...allergiesRecord, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (bodyEvaluation) {
      await BodyEvaluation.create(
        { ...bodyEvaluation, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    if (facialEvaluation) {
      const sanitizedFacial = {
        ...facialEvaluation,
        glogauScale: facialEvaluation.glogauScale || null,
        glogauObservations: facialEvaluation.glogauObservations || null,
      };
      await FacialEvaluation.create(
        { ...sanitizedFacial, assessmentId: assessment.assessmentId },
        { transaction: t },
      );
    }

    await createPendingPhotosForAssessment(
      { assessmentId: assessment.assessmentId },
      t,
    );

    await t.commit();

    const fullAssessment = await MedicalAssessment.findByPk(
      assessment.assessmentId,
      { include: fullIncludes },
    );

    res.status(201).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error creating historical assessment:", error);
    res.status(500).json({
      message: "Server error while creating historical assessment",
      error: error.message,
    });
  }
};

export const updateAssessment = async (req, res) => {
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
      serviceId,
      performedByUserId,
      assessmentDate,
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

    const allowedReferredMedia = [
      "Instagram",
      "Facebook",
      "TikTok",
      "Recomendacion",
      "Por su cuenta",
      "Otro",
    ];

    if (
      general?.referredMedia &&
      !allowedReferredMedia.includes(general.referredMedia)
    ) {
      await t.rollback();
      return res.status(400).json({
        message: `Medio de referencia inválido: ${general.referredMedia}`,
      });
    }

    const updatePayload = { ...(general || {}) };

    if (serviceId !== undefined) updatePayload.serviceId = serviceId;
    if (performedByUserId !== undefined)
      updatePayload.performedByUserId = performedByUserId;

    if (assessmentDate) {
      const parsedDate = new Date(`${assessmentDate}T00:00:00`);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(parsedDate.getTime()) || parsedDate > today) {
        await t.rollback();
        return res.status(400).json({
          message: "La fecha no puede ser posterior al día de hoy",
        });
      }
      updatePayload.serviceDate = assessmentDate;
    }

    await existing.update(updatePayload, { transaction: t });

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
      if (existingGyneco) {
        await existingGyneco.update(gynecoRecord, { transaction: t });
        if (obstetricDetails) {
          await ObstetricHistoryDetail.destroy({
            where: { gynecoId: existingGyneco.gynecoId },
            transaction: t,
          });
          if (obstetricDetails.length > 0) {
            await ObstetricHistoryDetail.bulkCreate(
              obstetricDetails.map((item) => ({
                ...item,
                gynecoId: existingGyneco.gynecoId,
              })),
              { transaction: t },
            );
          }
        }
      } else {
        const createdGyneco = await GynecoObstetricRecord.create(
          { ...gynecoRecord, assessmentId: id },
          { transaction: t },
        );
        if (obstetricDetails?.length > 0) {
          await ObstetricHistoryDetail.bulkCreate(
            obstetricDetails.map((item) => ({
              ...item,
              gynecoId: createdGyneco.gynecoId,
            })),
            { transaction: t },
          );
        }
      }
    }

    const upsertOneToOne = async (Model, data, whereField = "assessmentId") => {
      if (!data) return;
      const existingRow = await Model.findOne({
        where: { [whereField]: id },
        transaction: t,
      });
      if (existingRow) {
        await existingRow.update(data, { transaction: t });
      } else {
        await Model.create({ ...data, [whereField]: id }, { transaction: t });
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
    console.error("Error updating assessment:", error);
    res.status(500).json({
      message: "Server error while updating assessment",
      error: error.message,
    });
  }
};
// Expedientes históricos (sin cita) para pintarlos como eventos aparte en Agenda
export const getHistoricalAssessmentsForCalendar = async (req, res) => {
  try {
    const assessments = await MedicalAssessment.findAll({
      where: {
        appointmentId: null,
        isHidden: false,
        serviceDate: { [Op.ne]: null },
      },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
          where: { isHidden: false },
        },
        { model: Service, as: "service", attributes: ["serviceId", "name"] },
      ],
      attributes: ["assessmentId", "serviceDate", "customerId"],
    });

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching historical assessments",
      error: error.message,
    });
  }
};
