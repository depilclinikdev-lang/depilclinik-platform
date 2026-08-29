import express from "express";
import {
  getLatestLaserAssessmentByCustomer,
  getLaserAssessmentHistoryByCustomer,
  getLaserAssessmentByAppointment,
  createLaserAssessment,
  getAllLaserAssessments,
  getLaserAssessmentById,
  createHistoricalLaserAssessment,
  updateLaserAssessment,
} from "../controllers/laserAssessmentController.js";
import {
  protect,
  restrictTo,
  canAttendAppointment,
} from "../middlewares/auth.js";
import { getHistoricalLaserAssessmentsForCalendar } from "../controllers/laserAssessmentController.js";

const router = express.Router();

router.post(
  "/historical",
  protect,
  restrictTo("Administrador"),
  createHistoricalLaserAssessment,
);

router.put("/:id", protect, restrictTo("Administrador"), updateLaserAssessment);

router.get(
  "/customer/:customerId/latest",
  protect,
  restrictTo("Administrador"),
  getLatestLaserAssessmentByCustomer,
);

router.get(
  "/customer/:customerId/history",
  protect,
  restrictTo("Administrador"),
  getLaserAssessmentHistoryByCustomer,
);

router.get(
  "/all",
  protect,
  restrictTo("Administrador"),
  getAllLaserAssessments,
);

router.get(
  "/appointment/:appointmentId",
  protect,
  canAttendAppointment,
  getLaserAssessmentByAppointment,
);

router.post(
  "/appointment/:appointmentId",
  protect,
  canAttendAppointment,
  createLaserAssessment,
);

router.get(
  "/:id",
  protect,
  restrictTo("Administrador"),
  getLaserAssessmentById,
);
router.get(
  "/historical/calendar",
  protect,
  restrictTo("Administrador"),
  getHistoricalLaserAssessmentsForCalendar,
);

export default router;
