import express from "express";
import {
  getTodaySummary,
  getTopTreatments,
  getCollaboratorPerformance,
  getUpcomingAppointments,
  getMyTodayAppointments,
  getMyMonthlyCount,
  getMyUpcomingAppointments,
  getMyPendingAssessments,
  getMyTopTreatments,
} from "../controllers/dashboardController.js";
import { protect } from "../middlewares/auth.js";
import { cacheMiddleware } from "../middlewares/cache.js";

const router = express.Router();

router.get(
  "/today-summary",
  protect,
  cacheMiddleware("dashboard", 20),
  getTodaySummary,
);
router.get(
  "/top-treatments",
  protect,
  cacheMiddleware("dashboard", 30),
  getTopTreatments,
);
router.get(
  "/collaborator-performance",
  protect,
  cacheMiddleware("dashboard", 30),
  getCollaboratorPerformance,
);
router.get(
  "/upcoming-appointments",
  protect,
  cacheMiddleware("dashboard", 15),
  getUpcomingAppointments,
);

router.get("/my-today-appointments", protect, getMyTodayAppointments);
router.get("/my-monthly-count", protect, getMyMonthlyCount);
router.get("/my-upcoming-appointments", protect, getMyUpcomingAppointments);
router.get("/my-pending-assessments", protect, getMyPendingAssessments);
router.get("/my-top-treatments", protect, getMyTopTreatments);

export default router;
