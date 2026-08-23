import express from "express";
import {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  checkAppointmentConflict,
  getPendingCheckouts,
} from "../controllers/appointmentController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";
import { hideAppointment } from "../controllers/appointmentController.js";

const router = express.Router();

router.get("/", protect, getAllAppointments);
router.get("/check-conflict", protect, checkAppointmentConflict);
router.post(
  "/",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  createAppointment,
);
router.put(
  "/:id",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  updateAppointment,
);
router.patch(
  "/:id/status",
  protect,
  restrictTo("Administrador"),
  updateAppointmentStatus,
);
router.get(
  "/pending-checkouts",
  protect,
  restrictTo("Administrador"),
  getPendingCheckouts,
);
router.patch(
  "/:id/hide",
  protect,
  restrictTo("Administrador"),
  hideAppointment,
);

export default router;
