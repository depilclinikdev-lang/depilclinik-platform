import cron from "node-cron";
import { buildSalesPdfBuffer } from "../controllers/saleController.js";
import { uploadBufferToS3 } from "../utils/s3Storage.js";

const BRANDS = [
  { key: "todas", marca: undefined },
  { key: "modelha-dk", marca: "Modelha DK" },
  { key: "depilclinik", marca: "Depilclinik" },
];

const getPreviousMonthRange = () => {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();

  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { year, month, dateFrom, dateTo };
};

export const startMonthlyIncomeBackup = () => {
  // Corre el día 1 de cada mes, a la 1:00 AM
  cron.schedule("0 1 1 * *", async () => {
    const { year, month, dateFrom, dateTo } = getPreviousMonthRange();
    const monthLabel = `${year}-${String(month).padStart(2, "0")}`;

    console.log(
      `[Respaldo PDF] Generando reportes de ingresos para ${monthLabel}...`,
    );

    for (const brand of BRANDS) {
      try {
        const buffer = await buildSalesPdfBuffer({
          marca: brand.marca,
          dateFrom,
          dateTo,
        });

        const brandLabel =
          brand.key === "todas" ? "reporte-general" : `reporte-${brand.key}`;
        const objectKey = `depilclinik/reportes-ingresos/${year}/${String(month).padStart(2, "0")}/${brandLabel}-${monthLabel}.pdf`;

        await uploadBufferToS3(buffer, objectKey, "application/pdf");

        console.log(`[Respaldo PDF] Subido correctamente: ${objectKey}`);
      } catch (error) {
        console.error(
          `[Respaldo PDF] Error generando reporte de ${brand.key}:`,
          error.message,
        );
      }
    }
  });

  console.log("Scheduler de respaldo mensual de PDFs de ingresos iniciado.");
};
