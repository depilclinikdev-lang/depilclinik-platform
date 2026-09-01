import sequelize from "../config/db.js";
import LaserMedicalAssessment from "../models/LaserMedicalAssessment.js";
import LaserAreaOfInterest from "../models/LaserAreaOfInterest.js";
import LaserClinicalCondition from "../models/LaserClinicalCondition.js";
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
  { model: LaserAreaOfInterest, as: "areasOfInterest" },
  { model: LaserClinicalCondition, as: "clinicalConditions" },
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

// Campos comparables para la tabla de resultados de un paquete completado
const buildLaserComparableSnapshot = ({
  areasOfInterest,
  clinicalConditions,
}) => {
  const areas = areasOfInterest ? areasOfInterest.map((a) => a.areaName) : [];

  const conditions = clinicalConditions
    ? Object.keys(clinicalConditions)
        .filter(
          (k) =>
            k.startsWith("has") &&
            clinicalConditions[k] === true &&
            k !== "hasSignedConsent",
        )
        .map((k) => k)
    : [];

  return { areas, conditions };
};

// Obtiene el expediente vivo (más reciente) de un cliente para un servicio
export const getLaserAssessmentByCustomerAndService = async (req, res) => {
  try {
    const { customerId, serviceId } = req.params;

    const assessment = await LaserMedicalAssessment.findOne({
      where: { customerId, serviceId, isHidden: false },
      include: fullIncludes,
    });

    res.status(200).json(assessment || null);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching laser assessment",
      error: error.message,
    });
  }
};

// Lista los servicios Depilclinik que un cliente ha tenido con expediente,
// para la vista de "Servicios del cliente"
export const getCustomerLaserServiceSummaries = async (req, res) => {
  try {
    const { customerId } = req.params;

    const assessments = await LaserMedicalAssessment.findAll({
      where: { customerId, isHidden: false },
      include: [
        {
          model: Service,
          as: "service",
          attributes: ["serviceId", "name", "brand"],
        },
      ],
      attributes: [
        "laserAssessmentId",
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
          type: "laser",
          laserAssessmentId: a.laserAssessmentId,
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
      message: "Server error while fetching customer laser service summaries",
      error: error.message,
    });
  }
};

// Expediente ligado a una cita específica, con precarga del expediente
// vivo existente si el cliente ya tiene uno para este servicio
export const getLaserAssessmentByAppointment = async (req, res) => {
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
// atender una cita. Reemplaza al viejo createLaserAssessment.
export const createOrUpdateLaserAssessment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const appointment = req.appointment;

    const sanitizedBody = sanitizeEmptyStrings(req.body);
    const { general, areasOfInterest, clinicalConditions, sessionNote } =
      sanitizedBody;

    if (!general || !general.referredMedia) {
      await t.rollback();
      return res.status(400).json({
        message: "El medio de referencia es obligatorio",
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

    const isCollaborator = req.user.role !== "Administrador";

    let assessment = await LaserMedicalAssessment.findOne({
      where: {
        customerId: appointment.customerId,
        serviceId: appointment.serviceId,
      },
      transaction: t,
    });

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
      assessment = await LaserMedicalAssessment.create(basePayload, {
        transaction: t,
      });
    }

    await LaserAreaOfInterest.destroy({
      where: { laserAssessmentId: assessment.laserAssessmentId },
      transaction: t,
    });
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
      const existingConditions = await LaserClinicalCondition.findOne({
        where: { laserAssessmentId: assessment.laserAssessmentId },
        transaction: t,
      });
      if (existingConditions) {
        await existingConditions.update(clinicalConditions, {
          transaction: t,
        });
      } else {
        await LaserClinicalCondition.create(
          {
            ...clinicalConditions,
            laserAssessmentId: assessment.laserAssessmentId,
          },
          { transaction: t },
        );
      }
    }

    // --- Nota de sesión obligatoria, con la fecha real de la cita ---
    await AssessmentSessionNote.create(
      {
        laserAssessmentId: assessment.laserAssessmentId,
        noteDate: appointment.startTime,
        noteText: sessionNote.trim(),
        createdByUserId: req.user.id,
        packageId: packageSession ? packageSession.packageId : null,
        sessionNumber: packageSession ? packageSession.sessionNumber : null,
      },
      { transaction: t },
    );

    // --- Línea base del paquete (solo primera sesión de un paquete nuevo) ---
    if (isFirstSessionOfNewPackage) {
      const freshAreas = await LaserAreaOfInterest.findAll({
        where: { laserAssessmentId: assessment.laserAssessmentId },
        transaction: t,
      });
      const freshConditions = await LaserClinicalCondition.findOne({
        where: { laserAssessmentId: assessment.laserAssessmentId },
        transaction: t,
      });

      const snapshotData = buildLaserComparableSnapshot({
        areasOfInterest: freshAreas.map((a) => a.toJSON()),
        clinicalConditions: freshConditions?.toJSON(),
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
          laserAssessmentId: assessment.laserAssessmentId,
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
      { laserAssessmentId: assessment.laserAssessmentId },
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
      const { syncPackageSessionOnCompletion } =
        await import("./packageController.js");
      await syncPackageSessionOnCompletion(appointment.appointmentId, t);
      checkoutNeeded = !packageSession;
    }

    await t.commit();

    const fullAssessment = await LaserMedicalAssessment.findByPk(
      assessment.laserAssessmentId,
      { include: fullIncludes },
    );

    res.status(201).json({ assessment: fullAssessment, checkoutNeeded });
  } catch (error) {
    await t.rollback();
    console.error("Error saving laser assessment:", error);
    res.status(500).json({
      message: "Server error while saving laser assessment",
      error: error.message,
    });
  }
};

// Comparación de línea base vs. resultado final de un paquete completado
export const getLaserPackageComparison = async (req, res) => {
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
      message: "Server error while fetching laser package comparison",
      error: error.message,
    });
  }
};

// Edición manual del expediente vivo, sin necesidad de una cita
export const updateLaserAssessmentManually = async (req, res) => {
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
    const { general, areasOfInterest, clinicalConditions } = sanitizedBody;

    if (
      general?.referredMedia &&
      !allowedReferredMedia.includes(general.referredMedia)
    ) {
      await t.rollback();
      return res.status(400).json({
        message: `Medio de referencia inválido: ${general.referredMedia}`,
      });
    }

    await existing.update({ ...(general || {}) }, { transaction: t });

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
      const existingConditions = await LaserClinicalCondition.findOne({
        where: { laserAssessmentId: id },
        transaction: t,
      });
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
    }

    await t.commit();

    const fullAssessment = await LaserMedicalAssessment.findByPk(id, {
      include: fullIncludes,
    });

    res.status(200).json(fullAssessment);
  } catch (error) {
    await t.rollback();
    console.error("Error updating laser assessment manually:", error);
    res.status(500).json({
      message: "Server error while updating laser assessment",
      error: error.message,
    });
  }
};

export { buildLaserComparableSnapshot };
