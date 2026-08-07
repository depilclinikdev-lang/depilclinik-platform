import { Op, fn, col, literal } from "sequelize";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import MedicalAssessment from "../models/MedicalAssessment.js";
import LaserMedicalAssessment from "../models/LaserMedicalAssessment.js";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

// Resumen de tarjetas rápidas del día
export const getTodaySummary = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const totalAppointmentsToday = await Appointment.count({
      where: { startTime: { [Op.between]: [start, end] } },
    });

    const completedTodayAppointments = await Appointment.findAll({
      where: {
        status: "Completada",
        startTime: { [Op.between]: [start, end] },
      },
      attributes: ["customerId"],
    });
    const clientsAttendedToday = new Set(
      completedTodayAppointments.map((a) => a.customerId),
    ).size;

    const newClientsToday = await Customer.count({
      where: { created_at: { [Op.between]: [start, end] } },
    });

    res.status(200).json({
      totalAppointmentsToday,
      clientsAttendedToday,
      newClientsToday,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching today summary",
      error: error.message,
    });
  }
};

// Tratamientos más vendidos del mes (por citas completadas)
export const getTopTreatments = async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || now.getMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    const results = await Appointment.findAll({
      where: {
        status: "Completada",
        startTime: { [Op.between]: [start, end] },
      },
      attributes: [
        "serviceId",
        [fn("COUNT", col("Appointment.appointment_id")), "count"],
      ],
      include: [
        { model: Service, as: "service", attributes: ["name", "brand"] },
      ],
      group: ["serviceId", "service.service_id"],
      order: [[literal("count"), "DESC"]],
      limit: 5,
    });

    const formatted = results.map((r) => ({
      serviceId: r.serviceId,
      name: r.service?.name || "Servicio eliminado",
      brand: r.service?.brand,
      count: Number(r.get("count")),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching top treatments",
      error: error.message,
    });
  }
};

// Rendimiento de colaboradores del mes (servicios finalizados)
export const getCollaboratorPerformance = async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || now.getMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    const medicalResults = await MedicalAssessment.findAll({
      where: {
        created_at: { [Op.between]: [start, end] },
        filledByUserId: { [Op.ne]: null },
      },
      attributes: [
        "filledByUserId",
        [fn("COUNT", col("MedicalAssessment.assessment_id")), "count"],
      ],
      include: [{ model: User, as: "filledBy", attributes: ["id", "name"] }],
      group: ["filledByUserId", "filledBy.user_id"],
    });

    const laserResults = await LaserMedicalAssessment.findAll({
      where: {
        created_at: { [Op.between]: [start, end] },
        filledByUserId: { [Op.ne]: null },
      },
      attributes: [
        "filledByUserId",
        [
          fn("COUNT", col("LaserMedicalAssessment.laser_assessment_id")),
          "count",
        ],
      ],
      include: [{ model: User, as: "filledBy", attributes: ["id", "name"] }],
      group: ["filledByUserId", "filledBy.user_id"],
    });

    const countsByUser = new Map();

    const mergeResults = (results) => {
      results.forEach((result) => {
        const userId = result.filledByUserId;
        if (!userId) return;
        const count = Number(result.get("count")) || 0;
        const existing = countsByUser.get(userId) || {
          userId,
          name: result.filledBy?.name || "Sin asignar",
          count: 0,
        };
        existing.count += count;
        countsByUser.set(userId, existing);
      });
    };

    mergeResults(medicalResults);
    mergeResults(laserResults);

    const formatted = Array.from(countsByUser.values()).sort(
      (a, b) => b.count - a.count,
    );

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching collaborator performance",
      error: error.message,
    });
  }
};

export const getUpcomingAppointments = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const appointments = await Appointment.findAll({
      where: {
        status: { [Op.notIn]: ["Completada", "Cancelada"] },
        startTime: { [Op.gte]: startOfToday }, // 👈 Desde hoy en adelante
      },
      include: [
        { model: Customer, as: "customer", attributes: ["name", "phone"] },
        { model: Service, as: "service", attributes: ["name"] },
        { model: User, as: "collaborator", attributes: ["name"] },
      ],
      order: [["startTime", "ASC"]],
      limit: 12,
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching upcoming appointments",
      error: error.message,
    });
  }
};

// Citas del colaborador para el día de hoy
export const getMyTodayAppointments = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const appointments = await Appointment.findAll({
      where: {
        userId: req.user.id,
        startTime: { [Op.between]: [start, end] },
      },
      include: [
        { model: Customer, as: "customer", attributes: ["name", "phone"] },
        { model: Service, as: "service", attributes: ["name"] },
      ],
      order: [["startTime", "ASC"]],
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching your appointments today",
      error: error.message,
    });
  }
};

// Conteo de servicios completados por el colaborador este mes (sin comparar con otros)
export const getMyMonthlyCount = async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || now.getMonth() + 1;
    const { start, end } = getMonthRange(year, month);

    const medicalCount = await MedicalAssessment.count({
      where: {
        filledByUserId: req.user.id,
        created_at: { [Op.between]: [start, end] },
      },
    });

    const laserCount = await LaserMedicalAssessment.count({
      where: {
        filledByUserId: req.user.id,
        created_at: { [Op.between]: [start, end] },
      },
    });

    const completedCount = medicalCount + laserCount;

    res.status(200).json({ completedCount });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching your monthly count",
      error: error.message,
    });
  }
};

// Próximas citas asignadas al colaborador (no completadas ni canceladas)
export const getMyUpcomingAppointments = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const appointments = await Appointment.findAll({
      where: {
        userId: req.user.id,
        status: { [Op.notIn]: ["Completada", "Cancelada"] },
        startTime: { [Op.gte]: startOfToday },
      },
      include: [
        { model: Customer, as: "customer", attributes: ["name", "phone"] },
        { model: Service, as: "service", attributes: ["name"] },
      ],
      order: [["startTime", "ASC"]],
      limit: 12,
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching your upcoming appointments",
      error: error.message,
    });
  }
};

// Citas completadas por el colaborador cuyo expediente clínico aún no existe
export const getMyPendingAssessments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: {
        userId: req.user.id,
        status: "Completada",
      },
      include: [
        { model: Customer, as: "customer", attributes: ["name"] },
        { model: Service, as: "service", attributes: ["name", "brand"] },
        {
          model: MedicalAssessment,
          as: "medicalAssessment",
          attributes: ["assessmentId"],
        },
        {
          model: LaserMedicalAssessment,
          as: "laserAssessment",
          attributes: ["laserAssessmentId"],
        },
      ],
      order: [["startTime", "DESC"]],
      limit: 20,
    });

    const pending = appointments.filter(
      (appt) => !appt.medicalAssessment && !appt.laserAssessment,
    );

    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching your pending assessments",
      error: error.message,
    });
  }
};
