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
import Service from "../models/Service.js";

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
];

// Obtiene el expediente más reciente de un cliente (para CustomersPage)
export const getLatestAssessmentByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessment = await MedicalAssessment.findOne({
      where: { customerId },
      include: fullIncludes,
      order: [["created_at", "DESC"]],
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
      where: { customerId },
      include: fullIncludes,
      order: [["created_at", "DESC"]],
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

    if (!general || !general.consultationReason || !general.referredMedia) {
      await t.rollback();
      return res.status(400).json({
        message:
          "El motivo de consulta y el medio de referencia son obligatorios",
      });
    }

    const isCollaborator = req.user.role !== "Administrador";

    const assessment = await MedicalAssessment.create(
      {
        customerId: appointment.customerId,
        appointmentId: appointment.appointmentId,
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
        periodType: gynecoRecord.periodType || null,
      };

      console.log("gynecoRecord saneado:", JSON.stringify(safeGynecoRecord));

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
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "phone"],
        },
      ],
      order: [[sequelize.col("created_at"), "DESC"]],
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
