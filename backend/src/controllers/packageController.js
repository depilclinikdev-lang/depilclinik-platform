import { Op } from "sequelize";
import sequelize from "../config/db.js";
import CustomerPackage from "../models/CustomerPackage.js";
import PackageSession from "../models/PackageSession.js";
import PackagePayment from "../models/PackagePayment.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";

const recomputePaymentStatus = (total, paid) =>
  paid >= total ? "Pagado" : "Con adeudo";

const packageIncludes = [
  {
    model: Customer,
    as: "customer",
    attributes: ["customerId", "name", "phone"],
  },
  { model: Service, as: "service", attributes: ["serviceId", "name", "brand"] },
  {
    model: PackageSession,
    as: "sessions",
    include: [
      {
        model: Appointment,
        as: "appointment",
        attributes: ["appointmentId", "startTime", "endTime", "status"],
      },
    ],
  },
  { model: PackagePayment, as: "payments" },
];

// Crea el paquete + genera N filas de sesión en Pendiente
export const createPackage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerId,
      serviceId,
      marca,
      totalSessions,
      totalPrice,
      amountPaid,
      paymentMethod,
      notes,
    } = req.body;

    if (!customerId || !serviceId || !marca || !totalSessions || !totalPrice) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Cliente, servicio, marca, número de sesiones y precio son obligatorios",
      });
    }

    const paid = Number(amountPaid) || 0;
    if (paid > Number(totalPrice)) {
      await t.rollback();
      return res.status(400).json({
        message:
          "El monto pagado no puede ser mayor al precio total del paquete",
      });
    }

    const pkg = await CustomerPackage.create(
      {
        customerId,
        serviceId,
        marca,
        totalSessions,
        totalPrice,
        amountPaid: paid,
        paymentStatus: recomputePaymentStatus(totalPrice, paid),
        notes: notes || null,
        soldByUserId: req.user.id,
      },
      { transaction: t },
    );

    await PackageSession.bulkCreate(
      Array.from({ length: totalSessions }, (_, i) => ({
        packageId: pkg.packageId,
        sessionNumber: i + 1,
      })),
      { transaction: t },
    );

    if (paid > 0) {
      await PackagePayment.create(
        {
          packageId: pkg.packageId,
          amount: paid,
          paymentMethod: paymentMethod || "Efectivo",
          registeredByUserId: req.user.id,
        },
        { transaction: t },
      );
    }

    await t.commit();

    const fullPackage = await CustomerPackage.findByPk(pkg.packageId, {
      include: packageIncludes,
    });
    res.status(201).json(fullPackage);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while creating package",
      error: error.message,
    });
  }
};

export const getAllPackages = async (req, res) => {
  try {
    const { marca, status, paymentStatus, search } = req.query;
    const where = {};
    if (marca) where.marca = marca;
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where["$customer.name$"] = { [Op.like]: `%${search}%` };
    }

    const packages = await CustomerPackage.findAll({
      where,
      include: packageIncludes,
      order: [["created_at", "DESC"]],
      subQuery: false,
    });

    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching packages",
      error: error.message,
    });
  }
};

export const getPackagesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const packages = await CustomerPackage.findAll({
      where: { customerId },
      include: packageIncludes,
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching customer packages",
      error: error.message,
    });
  }
};

export const getPackageById = async (req, res) => {
  try {
    const pkg = await CustomerPackage.findByPk(req.params.id, {
      include: packageIncludes,
    });
    if (!pkg) return res.status(404).json({ message: "Paquete no encontrado" });
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching package",
      error: error.message,
    });
  }
};

export const registerPackagePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    if (!amount || Number(amount) <= 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "El monto del abono debe ser mayor a cero" });
    }

    const pkg = await CustomerPackage.findByPk(id, { transaction: t });
    if (!pkg) {
      await t.rollback();
      return res.status(404).json({ message: "Paquete no encontrado" });
    }

    const newPaid = parseFloat(pkg.amountPaid) + Number(amount);
    if (newPaid > parseFloat(pkg.totalPrice)) {
      await t.rollback();
      return res.status(400).json({
        message: `El abono excede el saldo pendiente (${(pkg.totalPrice - pkg.amountPaid).toFixed(2)})`,
      });
    }

    await PackagePayment.create(
      {
        packageId: pkg.packageId,
        amount,
        paymentMethod: paymentMethod || "Efectivo",
        registeredByUserId: req.user.id,
      },
      { transaction: t },
    );

    await pkg.update(
      {
        amountPaid: newPaid,
        paymentStatus: recomputePaymentStatus(pkg.totalPrice, newPaid),
      },
      { transaction: t },
    );

    await t.commit();
    const fullPackage = await CustomerPackage.findByPk(id, {
      include: packageIncludes,
    });
    res.status(200).json(fullPackage);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while registering package payment",
      error: error.message,
    });
  }
};

// Agenda la SIGUIENTE sesión pendiente del paquete como una cita real,
// reutilizando la misma detección de conflicto que appointmentController.
export const scheduleNextSession = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { userId, startTime, endTime, force } = req.body;

    const pkg = await CustomerPackage.findByPk(id, { transaction: t });
    if (!pkg) {
      await t.rollback();
      return res.status(404).json({ message: "Paquete no encontrado" });
    }
    if (pkg.status !== "Activo") {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Este paquete ya no está activo" });
    }

    const nextSession = await PackageSession.findOne({
      where: { packageId: id, status: "Pendiente" },
      order: [["sessionNumber", "ASC"]],
      transaction: t,
    });

    if (!nextSession) {
      await t.rollback();
      return res.status(400).json({
        message: "No hay sesiones pendientes por agendar en este paquete",
      });
    }

    if (!startTime || !endTime || new Date(endTime) <= new Date(startTime)) {
      await t.rollback();
      return res.status(400).json({
        message: "Completa una fecha/hora de inicio y fin válidas",
      });
    }

    if (userId) {
      const conflict = await Appointment.findOne({
        where: {
          userId,
          status: { [Op.ne]: "Cancelada" },
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime },
        },
        transaction: t,
      });
      const canOverride = force === true && req.user.role === "Administrador";
      if (conflict && !canOverride) {
        await t.rollback();
        return res.status(409).json({
          message: "El colaborador ya tiene una cita asignada en ese horario",
          conflict,
        });
      }
    }

    const appointment = await Appointment.create(
      {
        customerId: pkg.customerId,
        serviceId: pkg.serviceId,
        userId: userId || null,
        marca: pkg.marca,
        startTime,
        endTime,
      },
      { transaction: t },
    );

    await nextSession.update(
      { appointmentId: appointment.appointmentId, status: "Agendada" },
      { transaction: t },
    );

    await t.commit();

    const fullPackage = await CustomerPackage.findByPk(id, {
      include: packageIncludes,
    });
    res.status(201).json(fullPackage);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while scheduling next session",
      error: error.message,
    });
  }
};

export const cancelPackage = async (req, res) => {
  try {
    const pkg = await CustomerPackage.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Paquete no encontrado" });
    await pkg.update({ status: "Cancelado" });
    res.status(200).json({ message: "Paquete cancelado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Server error while cancelling package",
      error: error.message,
    });
  }
};

// Se llama internamente cuando una cita ligada a una sesión se marca Completada
export const syncPackageSessionOnCompletion = async (
  appointmentId,
  transaction,
) => {
  const session = await PackageSession.findOne({
    where: { appointmentId },
    transaction,
  });
  if (!session || session.status === "Completada") return;

  await session.update(
    { status: "Completada", completedAt: new Date() },
    { transaction },
  );

  const pkg = await CustomerPackage.findByPk(session.packageId, {
    transaction,
  });
  const newCompleted = pkg.sessionsCompleted + 1;
  const isFinished = newCompleted >= pkg.totalSessions;

  await pkg.update(
    {
      sessionsCompleted: newCompleted,
      status: isFinished ? "Completado" : pkg.status,
    },
    { transaction },
  );
};
