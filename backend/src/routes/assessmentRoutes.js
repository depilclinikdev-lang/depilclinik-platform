import express from "express";
import {
  getLatestAssessmentByCustomer,
  getAssessmentHistoryByCustomer,
  getAssessmentByAppointment,
  createAssessment,
  getAllAssessments,
  getAssessmentById,
} from "../controllers/assessmentController.js";
import {
  protect,
  restrictTo,
  canAttendAppointment,
} from "../middlewares/auth.js";
import { createHistoricalAssessment } from "../controllers/assessmentController.js";
import { updateAssessment } from "../controllers/assessmentController.js";
import { getHistoricalAssessmentsForCalendar } from "../controllers/assessmentController.js";

const router = express.Router();

router.get(
  "/customer/:customerId/latest",
  protect,
  restrictTo("Administrador"),
  getLatestAssessmentByCustomer,
);

router.get(
  "/customer/:customerId/history",
  protect,
  restrictTo("Administrador"),
  getAssessmentHistoryByCustomer,
);

router.get("/all", protect, restrictTo("Administrador"), getAllAssessments);

router.get(
  "/appointment/:appointmentId",
  protect,
  canAttendAppointment,
  getAssessmentByAppointment,
);

router.post(
  "/appointment/:appointmentId",
  protect,
  canAttendAppointment,
  createAssessment,
);
router.post(
  "/historical",
  protect,
  restrictTo("Administrador"),
  createHistoricalAssessment,
);
router.put("/:id", protect, restrictTo("Administrador"), updateAssessment);

router.get("/:id", protect, restrictTo("Administrador"), getAssessmentById);

router.get(
  "/historical/calendar",
  protect,
  restrictTo("Administrador"),
  getHistoricalAssessmentsForCalendar,
);

export default router;
