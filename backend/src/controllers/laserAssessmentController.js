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
import User from "../models/User.js";

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
  { model: Service, as: "service", attributes: ["serviceId", "name", "brand"] },
  { model: User, as: "performedBy", attributes: ["id", "name"] },
];

// Obtiene el expediente Depilclinik más reciente de un cliente
export const getLatestLaserAssessmentByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessment = await LaserMedicalAssessment.findOne({
      where: { customerId, isHidden: false },
      include: fullIncludes,
      order: [[sequelize.col("service_date"), "DESC"]],
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
      where: { customerId, isHidden: false },
      include: fullIncludes,
      order: [[sequelize.col("service_date"), "DESC"]],
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

export const createHistoricalLaserAssessment = async (req, res) => {
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
    const { general, areasOfInterest, clinicalConditions } = sanitizedBody;

    if (!general || !general.referredMedia) {
      await t.rollback();
      return res.status(400).json({
        message: "El medio de referencia es obligatorio",
      });
    }

    const assessment = await LaserMedicalAssessment.create(
      {
        customerId,
        appointmentId: null,
        serviceId,
        performedByUserId: performedByUserId || null,
        serviceDate: assessmentDate,
        ...general,
        serviceDate: parsedDate,
        filledByUserId: req.user.id,
        filledAt: new Date(),
        lockedForCollaborator: false,
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

    await createPendingPhotosForAssessment(
      { laserAssessmentId: assessment.laserAssessmentId },
      t,
    );

    await t.commit();

    const fullAssessment = await LaserMedicalAssessment.findByPk(
      assessment.laserAssessmentId,
      { include: fullIncludes },
    );

    res.status(201).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error creating historical laser assessment:", error);
    res.status(500).json({
      message: "Server error while creating historical laser assessment",
      error: error.message,
    });
  }
};

export const updateLaserAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const existing = await LaserMedicalAssessment.findByPk(id, {
      transaction: t,
    });

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
      areasOfInterest,
      clinicalConditions,
    } = sanitizedBody;

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

    if (areasOfInterest) {
      await LaserAreaOfInterest.destroy({
        where: { laserAssessmentId: id },
        transaction: t,
      });
      if (areasOfInterest.length > 0) {
        await LaserAreaOfInterest.bulkCreate(
          areasOfInterest.map((areaName) => ({
            areaName,
            laserAssessmentId: id,
          })),
          { transaction: t },
        );
      }
    }

    if (clinicalConditions) {
      await LaserClinicalCondition.findOne({
        where: { laserAssessmentId: id },
        transaction: t,
      }).then(async (existingConditions) => {
        if (existingConditions) {
          await existingConditions.update(clinicalConditions, {
            transaction: t,
          });
        } else {
          await LaserClinicalCondition.create(
            { ...clinicalConditions, laserAssessmentId: id },
            { transaction: t },
          );
        }
      });
    }

    await t.commit();

    const fullAssessment = await LaserMedicalAssessment.findByPk(id, {
      include: fullIncludes,
    });

    res.status(200).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error updating laser assessment:", error);
    res.status(500).json({
      message: "Server error while updating laser assessment",
      error: error.message,
    });
  }
};
