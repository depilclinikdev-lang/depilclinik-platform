import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import sequelize from "./src/config/db.js";
import { globalLimiter } from "./src/middlewares/rateLimiter.js";
import swaggerSpec from "./src/config/swagger.js";
import swaggerUi from "swagger-ui-express";

// Rutas
import authRoutes from "./src/routes/authRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import serviceRoutes from "./src/routes/serviceRoutes.js";
import assessmentRoutes from "./src/routes/assessmentRoutes.js";
import laserAssessmentRoutes from "./src/routes/laserAssessmentRoutes.js";
import assessmentPhotoRoutes from "./src/routes/assessmentPhotoRoutes.js";
import saleRoutes from "./src/routes/saleRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

import whatsappRoutes from "./src/routes/whatsappRoutes.js";
import "./src/workers/whatsappWorker.js"; // arranca el worker al importar
import { startWhatsappScheduler } from "./src/jobs/scheduleWhatsappReminders.js";
import { startMonthlyIncomeBackup } from "./src/jobs/scheduleMonthlyIncomeBackup.js";

dotenv.config();

const app = express();

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Endpoints del sistema
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/laser-assessments", laserAssessmentRoutes);
app.use("/api/assessment-photos", assessmentPhotoRoutes);
app.use("/api/sales", saleRoutes);

app.use("/api/whatsapp", whatsappRoutes);

const PORT = process.env.PORT || 5000;

async function connectWithRetry(retries = 10, delay = 5000) {
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log("¡Conexión exitosa con el MySQL de Docker!");
      return;
    } catch (error) {
      retries--;
      console.log(
        `La base de datos aún no responde. Reintentando en ${delay / 1000}s... (Quedan ${retries} intentos)`,
      );
      if (retries === 0) {
        console.error(
          "Se agotaron los intentos de conexión. No se pudo conectar a la base de datos:",
          error,
        );
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function startServer() {
  await connectWithRetry();

  try {
    await sequelize.authenticate();
    console.log(
      "Conexión con MySQL verificada. El esquema se gestiona manualmente vía init.sql.",
    );
    startWhatsappScheduler();
    startMonthlyIncomeBackup();
  } catch (error) {
    console.error(
      "Error al verificar la conexión con la base de datos:",
      error,
    );
  }

  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en: http://localhost:${PORT}`);
  });
}

startServer();
