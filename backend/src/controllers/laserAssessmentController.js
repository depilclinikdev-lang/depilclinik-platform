import sequelize from "../config/db.js";
import LaserMedicalAssessment from "../models/LaserMedicalAssessment.js";
import LaserAreaOfInterest from "../models/LaserAreaOfInterest.js";
import LaserClinicalCondition from "../models/LaserClinicalCondition.js";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import { sanitizeEmptyStrings } from "../utils/sanitize.js";
import { createPendingPhotosForAssessment } from "./assessmentPhotoController.js";
import { syncPackageSessionOnCompletion } from "./packageController.js";
import Service from "../models/Service.js";

const fullIncludes = [
  { model: LaserAreaOfInterest, as: "areasOfInterest" },
  { model: LaserClinicalCondition, as: "clinicalConditions" },
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

// Obtiene el expediente Depilclinik más reciente de un cliente
export const getLatestLaserAssessmentByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessment = await LaserMedicalAssessment.findOne({
      where: { customerId },
      include: fullIncludes,
      order: [[sequelize.col("created_at"), "DESC"]],
    });

    if (!assessment) {
      return res.status(404).json({
        message: "Este cliente aún no tiene expedientes de Depilclinik",
      });
    }

    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching latest laser assessment",
      error: error.message,
    });
  }
};

// Historial completo (solo Administrador, validado en la ruta)
export const getLaserAssessmentHistoryByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessments = await LaserMedicalAssessment.findAll({
      where: { customerId },
      include: fullIncludes,
      order: [[sequelize.col("created_at"), "DESC"]],
    });

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching laser assessment history",
      error: error.message,
    });
  }
};

// Expediente ligado a una cita específica
export const getLaserAssessmentByAppointment = async (req, res) => {
  try {
    const appointment = req.appointment;

    const assessment = await LaserMedicalAssessment.findOne({
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
      message: "Server error while fetching laser assessment for appointment",
      error: error.message,
    });
  }
};

// Crea el expediente Depilclinik completo de una sesión
export const createLaserAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const appointment = req.appointment;

    // Evita duplicar el expediente si la cita ya tiene uno registrado
    // (por ejemplo, si la administradora atiende una cita que el
    // colaborador ya había llenado, o si se reintenta el envío).
    const existingForAppointment = await LaserMedicalAssessment.findOne({
      where: { appointmentId: appointment.appointmentId },
      transaction: t,
    });

    if (existingForAppointment) {
      await t.rollback();
      return res.status(400).json({
        message: "Esta cita ya tiene un expediente clínico registrado",
      });
    }

    const sanitizedBody = sanitizeEmptyStrings(req.body);
    const { general, areasOfInterest, clinicalConditions } = sanitizedBody;

    if (!general || !general.referredMedia) {
      await t.rollback();
      return res.status(400).json({
        message: "El medio de referencia es obligatorio",
      });
    }

    const isCollaborator = req.user.role !== "Administrador";

    const assessment = await LaserMedicalAssessment.create(
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

    if (areasOfInterest?.length > 0) {
      await LaserAreaOfInterest.bulkCreate(
        areasOfInterest.map((areaName) => ({
          areaName,
          laserAssessmentId: assessment.laserAssessmentId,
        })),
        { transaction: t },
      );
    }

    if (clinicalConditions) {
      await LaserClinicalCondition.create(
        {
          ...clinicalConditions,
          laserAssessmentId: assessment.laserAssessmentId,
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
      { laserAssessmentId: assessment.laserAssessmentId },
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

    const fullAssessment = await LaserMedicalAssessment.findByPk(
      assessment.laserAssessmentId,
      { include: fullIncludes },
    );

    res.status(201).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while creating laser assessment",
      error: error.message,
    });
  }
};

export const getAllLaserAssessments = async (req, res) => {
  try {
    const assessments = await LaserMedicalAssessment.findAll({
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
      message: "Server error while fetching all laser assessments",
      error: error.message,
    });
  }
};

export const getLaserAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await LaserMedicalAssessment.findByPk(id, {
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
    res.status(500).json({
      message: "Server error while fetching laser assessment",
      error: error.message,
    });
  }
};
