import { Op } from "sequelize";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import Sale from "../models/Sale.js";
import PackageSession from "../models/PackageSession.js";
import MedicalAssessment from "../models/MedicalAssessment.js";
import LaserMedicalAssessment from "../models/LaserMedicalAssessment.js";
import sequelize from "../config/db.js";
import { syncPackageSessionOnCompletion } from "./packageController.js";

export const updateAppointmentStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = [
      "Programada",
      "Confirmada",
      "En Tratamiento",
      "Completada",
      "Cancelada",
    ];

    if (!validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({ message: "Estado no válido" });
    }

    const appointment = await Appointment.findByPk(id, { transaction: t });
    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    await appointment.update({ status }, { transaction: t });

    if (status === "Completada") {
      await syncPackageSessionOnCompletion(id, t);
    }

    await t.commit();
    res.status(200).json({ message: "Estado actualizado", status });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while updating status",
      error: error.message,
    });
  }
};

const appointmentIncludes = [
  {
    model: Customer,
    as: "customer",
    attributes: ["customerId", "name", "phone"],
  },
  { model: Service, as: "service", attributes: ["serviceId", "name", "brand"] },
  { model: User, as: "collaborator", attributes: ["id", "name"] },
  { model: Sale, as: "sale", attributes: ["saleId", "folio", "status"] },
  {
    model: PackageSession,
    as: "packageSession",
    attributes: ["packageSessionId", "packageId", "status"],
    required: false,
  },
  {
    model: MedicalAssessment,
    as: "medicalAssessment",
    attributes: ["assessmentId"],
    required: false,
  },
  {
    model: LaserMedicalAssessment,
    as: "laserAssessment",
    attributes: ["laserAssessmentId"],
    required: false,
  },
];

const conflictIncludes = [
  { model: Customer, as: "customer", attributes: ["name"] },
  { model: Service, as: "service", attributes: ["name"] },
];

const findConflictingAppointment = async (
  userId,
  startTime,
  endTime,
  excludeId = null,
) => {
  const where = {
    userId,
    status: { [Op.ne]: "Cancelada" },
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
  };

  if (excludeId) {
    where.appointmentId = { [Op.ne]: excludeId };
  }

  return Appointment.findOne({ where, include: conflictIncludes });
};

export const getAllAppointments = async (req, res) => {
  try {
    const where =
      req.user.role === "Administrador"
        ? { isHidden: false, "$customer.is_hidden$": false }
        : {
            userId: req.user.id,
            isHidden: false,
            "$customer.is_hidden$": false,
          };

    const appointments = await Appointment.findAll({
      where,
      include: appointmentIncludes,
      order: [["startTime", "ASC"]],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching appointments",
      error: error.message,
    });
  }
};

export const checkAppointmentConflict = async (req, res) => {
  try {
    const { userId, startTime, endTime, excludeId } = req.query;

    if (!userId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Faltan parámetros para validar el conflicto" });
    }

    const conflict = await findConflictingAppointment(
      userId,
      startTime,
      endTime,
      excludeId,
    );

    res.status(200).json({ hasConflict: Boolean(conflict), conflict });
  } catch (error) {
    res.status(500).json({
      message: "Server error while checking appointment conflict",
      error: error.message,
    });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { customerId, serviceId, userId, marca, startTime, endTime, force } =
      req.body;

    if (!customerId || !serviceId || !marca || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Faltan campos requeridos para agendar la cita" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Selecciona un colaborador para la cita" });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        message: "La hora de fin debe ser posterior a la hora de inicio",
      });
    }

    if (userId) {
      const conflict = await findConflictingAppointment(
        userId,
        startTime,
        endTime,
      );
      const canOverride = force === true && req.user.role === "Administrador";

      if (conflict && !canOverride) {
        return res.status(409).json({
          message: "El colaborador ya tiene una cita asignada en ese horario",
          conflict,
        });
      }
    }

    const newAppointment = await Appointment.create({
      customerId,
      serviceId,
      userId: userId || null,
      marca,
      startTime,
      endTime,
    });

    const fullAppointment = await Appointment.findByPk(
      newAppointment.appointmentId,
      {
        include: appointmentIncludes,
      },
    );

    res.status(201).json(fullAppointment);
  } catch (error) {
    res.status(500).json({
      message: "Server error while creating appointment",
      error: error.message,
    });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    const { userId, startTime, endTime, force } = req.body;
    const effectiveUserId = userId !== undefined ? userId : appointment.userId;
    const effectiveStart = startTime || appointment.startTime;
    const effectiveEnd = endTime || appointment.endTime;

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        message: "La hora de fin debe ser posterior a la hora de inicio",
      });
    }

    if (effectiveUserId) {
      const conflict = await findConflictingAppointment(
        effectiveUserId,
        effectiveStart,
        effectiveEnd,
        id,
      );
      const canOverride = force === true && req.user.role === "Administrador";

      if (conflict && !canOverride) {
        return res.status(409).json({
          message: "El colaborador ya tiene una cita asignada en ese horario",
          conflict,
        });
      }
    }

    await appointment.update(req.body);

    const updated = await Appointment.findByPk(id, {
      include: appointmentIncludes,
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating appointment",
      error: error.message,
    });
  }
};

export const getPendingCheckouts = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: {
        status: "Completada",
        isHidden: false,
        "$customer.is_hidden$": false,
      },
      include: [
        { model: Customer, as: "customer", attributes: ["name"] },
        { model: Service, as: "service", attributes: ["name"] },
        { model: Sale, as: "sale", attributes: ["saleId"] },
        {
          model: PackageSession,
          as: "packageSession",
          attributes: ["packageSessionId"],
          required: false,
        },
      ],
      order: [["startTime", "DESC"]],
    });

    const pending = appointments.filter((a) => !a.sale && !a.packageSession);

    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching pending checkouts",
      error: error.message,
    });
  }
};

export const hideAppointment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: ["medicalAssessment", "laserAssessment", "packageSession"],
      transaction: t,
    });

    const hasSignedAssessment =
      (appointment?.medicalAssessment &&
        appointment.medicalAssessment.hasSignedConsent) ||
      (appointment?.laserAssessment &&
        appointment.laserAssessment.hasSignedConsent);

    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    if (hasSignedAssessment) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Esta cita ya tiene un expediente clínico registrado y no puede eliminarse. Puedes cancelarla en su lugar.",
      });
    }

    if (appointment.packageSession) {
      await appointment.packageSession.update(
        { appointmentId: null, status: "Pendiente" },
        { transaction: t },
      );
    }

    await appointment.update({ isHidden: true }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while hiding appointment",
      error: error.message,
    });
  }
};
