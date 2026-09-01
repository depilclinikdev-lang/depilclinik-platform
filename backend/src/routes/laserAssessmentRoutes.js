import express from "express";
import {
  getLaserAssessmentByCustomerAndService,
  getCustomerLaserServiceSummaries,
  getLaserAssessmentByAppointment,
  createOrUpdateLaserAssessment,
  getLaserPackageComparison,
  updateLaserAssessmentManually,
} from "../controllers/laserAssessmentController.js";
import {
  protect,
  restrictTo,
  canAttendAppointment,
} from "../middlewares/auth.js";

const router = express.Router();

// Lista los servicios que un cliente ha tenido con expediente (Depilclinik)
router.get(
  "/customer/:customerId/services",
  protect,
  restrictTo("Administrador"),
  getCustomerLaserServiceSummaries,
);

// Expediente vivo de un cliente para un servicio específico
router.get(
  "/customer/:customerId/service/:serviceId",
  protect,
  restrictTo("Administrador"),
  getLaserAssessmentByCustomerAndService,
);

// Comparación línea base / final de un paquete completado
router.get(
  "/package-comparison/:packageId",
  protect,
  restrictTo("Administrador"),
  getLaserPackageComparison,
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
  createOrUpdateLaserAssessment,
);

// Edición manual del expediente vivo, sin necesidad de cita
router.put(
  "/:id",
  protect,
  restrictTo("Administrador"),
  updateLaserAssessmentManually,
);

export default router;
