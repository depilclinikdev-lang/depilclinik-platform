import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  reactivateCustomer,
  searchCustomers,
} from "../controllers/customerController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";
import { hideCustomer } from "../controllers/customerController.js";

const router = express.Router();
// El directorio completo de clientes es exclusivo de Administrador,
router.post(
  "/create",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  createCustomer,
);
router.get("/", protect, restrictTo("Administrador"), getAllCustomers);
router.get("/search", protect, restrictTo("Administrador"), searchCustomers);
router.get("/:id", protect, restrictTo("Administrador"), getCustomerById);
router.put(
  "/:id",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  updateCustomer,
);

router.patch(
  "/:id/delete",
  protect,
  restrictTo("Administrador"),
  deleteCustomer,
);
router.patch(
  "/:id/reactivate",
  protect,
  restrictTo("Administrador"),
  reactivateCustomer,
);
router.patch("/:id/hide", protect, restrictTo("Administrador"), hideCustomer);

export default router;
