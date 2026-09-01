import express from "express";
import {
  createPackage,
  getAllPackages,
  getPackagesByCustomer,
  getPackagesByCustomerAndService,
  getPackageById,
  updatePackage,
  registerPackagePayment,
  scheduleNextSession,
  cancelPackage,
  hidePackage,
} from "../controllers/packageController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", protect, restrictTo("Administrador"), createPackage);

router.get("/", protect, restrictTo("Administrador"), getAllPackages);

router.get(
  "/customer/:customerId",
  protect,
  restrictTo("Administrador"),
  getPackagesByCustomer,
);

router.get(
  "/customer/:customerId/service/:serviceId",
  protect,
  restrictTo("Administrador"),
  getPackagesByCustomerAndService,
);

router.get("/:id", protect, restrictTo("Administrador"), getPackageById);

router.put("/:id", protect, restrictTo("Administrador"), updatePackage);

router.post(
  "/:id/payments",
  protect,
  restrictTo("Administrador"),
  registerPackagePayment,
);

router.post(
  "/:id/schedule-next",
  protect,
  restrictTo("Administrador"),
  scheduleNextSession,
);

router.patch(
  "/:id/cancel",
  protect,
  restrictTo("Administrador"),
  cancelPackage,
);

router.patch("/:id/hide", protect, restrictTo("Administrador"), hidePackage);

export default router;
