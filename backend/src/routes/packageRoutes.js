import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";
import {
  createPackage,
  getAllPackages,
  getPackagesByCustomer,
  getPackageById,
  updatePackage,
  registerPackagePayment,
  scheduleNextSession,
  cancelPackage,
} from "../controllers/packageController.js";

const router = express.Router();

router.get("/", protect, restrictTo("Administrador"), getAllPackages);
router.get(
  "/customer/:customerId",
  protect,
  restrictTo("Administrador"),
  getPackagesByCustomer,
);
router.get("/:id", protect, restrictTo("Administrador"), getPackageById);

router.post(
  "/",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  createPackage,
);
router.post(
  "/:id/payments",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  registerPackagePayment,
);
router.post(
  "/:id/schedule-next",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  scheduleNextSession,
);
router.patch(
  "/:id/cancel",
  protect,
  restrictTo("Administrador"),
  cancelPackage,
);
router.put(
  "/:id",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  updatePackage,
);
export default router;
