import express from "express";
import {
  createSale,
  registerPayment,
  getSalesHistory,
  getSaleById,
  getTodayIncome,
  getMonthlySummary,
  getPendingAccounts,
  getCustomerPendingDebts,
  exportSalesPdf,
} from "../controllers/saleController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimiter.js";
import {
  getIncomeForRange,
  getDailyIncomeForRange,
} from "../controllers/saleController.js";

const router = express.Router();

router.get("/today-income", protect, getTodayIncome);
router.get(
  "/monthly-summary",
  protect,
  restrictTo("Administrador"),
  getMonthlySummary,
);
router.get(
  "/pending-accounts",
  protect,
  restrictTo("Administrador"),
  getPendingAccounts,
);
router.get("/customer-debts/:customerId", protect, getCustomerPendingDebts);
router.get("/export-pdf", protect, restrictTo("Administrador"), exportSalesPdf);
router.get("/", protect, restrictTo("Administrador"), getSalesHistory);

router.post(
  "/",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  createSale,
);
router.post(
  "/:id/payments",
  protect,
  restrictTo("Administrador"),
  writeLimiter,
  registerPayment,
);
router.get(
  "/income-range",
  protect,
  restrictTo("Administrador"),
  getIncomeForRange,
);
router.get(
  "/daily-income-range",
  protect,
  restrictTo("Administrador"),
  getDailyIncomeForRange,
);

router.get("/:id", protect, restrictTo("Administrador"), getSaleById);

export default router;
