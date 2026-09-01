import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// Generar Access Token (15 min)
export const generateAccessToken = (user) => {
  // Usamos user.user_id o user.id de forma segura
  const idToSign = user.user_id || user.id;
  const roleToSign = user.rol || user.role;

  return jwt.sign(
    { id: idToSign, role: roleToSign },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

// Generar Refresh Token (8h)
export const generateRefreshToken = (user) => {
  const idToSign = user.user_id || user.id;
  return jwt.sign({ id: idToSign }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "8h",
  });
};

// Middleware para proteger rutas mediante cookies HTTPOnly
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: "No autorizado, falta token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user || (!user.is_active && user.isActive === false)) {
      return res
        .status(401)
        .json({ message: "Cuenta inactiva o no encontrada" });
    }

    req.user = {
      id: user.user_id || user.id,
      role: user.rol || user.role,
      name: user.name,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "No autorizado, token expirado o inválido",
      error: error.message,
    });
  }
};

// Restringir acceso por rol
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para realizar esta acción" });
    }
    next();
  };
};

// Un colaborador puede atender la cita si está asignada a él y aún no ha
// sido completada. Una vez que la cita pasa a "Completada" (justo al
// guardar el expediente), queda bloqueada para ese colaborador — solo el
// Administrador puede reabrirla para corregir algo.
export const canAttendAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    if (req.user.role === "Administrador") {
      req.appointment = appointment;
      return next();
    }

    if (
      appointment.userId !== req.user.id &&
      appointment.user_id !== req.user.id
    ) {
      return res.status(403).json({
        message: "Esta cita no está asignada a tu usuario",
      });
    }

    if (appointment.status === "Completada") {
      return res.status(403).json({
        message: "Esta cita ya fue atendida y no puede volver a abrirse",
      });
    }

    req.appointment = appointment;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error al validar el acceso a la cita",
      error: error.message,
    });
  }
};
