import express from "express";
import {
  getAssessmentByCustomerAndService,
  getCustomerServiceSummaries,
  getAssessmentByAppointment,
  createOrUpdateAssessment,
  getPackageComparison,
  updateAssessmentManually,
  createHistoricalEntry,
} from "../controllers/assessmentController.js";
import {
  protect,
  restrictTo,
  canAttendAppointment,
} from "../middlewares/auth.js";

const router = express.Router();

// Lista los servicios que un cliente ha tenido con expediente (Modelha DK)
router.get(
  "/customer/:customerId/services",
  protect,
  restrictTo("Administrador"),
  getCustomerServiceSummaries,
);

// Expediente vivo de un cliente para un servicio específico
router.get(
  "/customer/:customerId/service/:serviceId",
  protect,
  restrictTo("Administrador"),
  getAssessmentByCustomerAndService,
);

// Comparación línea base / final de un paquete completado
router.get(
  "/package-comparison/:packageId",
  protect,
  restrictTo("Administrador"),
  getPackageComparison,
);

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
  createOrUpdateAssessment,
);

// Edición manual del expediente vivo, sin necesidad de cita
router.put(
  "/:id",
  protect,
  restrictTo("Administrador"),
  updateAssessmentManually,
);

// Registro histórico (fecha anterior a hoy, sin cita)
router.post(
  "/historical-entry",
  protect,
  restrictTo("Administrador"),
  createHistoricalEntry,
);

export default router;
