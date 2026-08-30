import { Op } from "sequelize";
import sequelize from "../config/db.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import SalePayment from "../models/SalePayment.js";
import CustomerPackage from "../models/CustomerPackage.js";
import PackagePayment from "../models/PackagePayment.js";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import PDFDocument from "pdfkit";

const saleIncludes = [
  {
    model: Customer,
    as: "customer",
    attributes: ["customerId", "name", "phone"],
  },
  { model: User, as: "collaborator", attributes: ["id", "name"] },
  {
    model: SaleItem,
    as: "items",
    include: [
      {
        model: Service,
        as: "service",
        attributes: ["serviceId", "name"],
      },
    ],
  },
  { model: SalePayment, as: "payments" },
];

const packageIncludes = [
  {
    model: Customer,
    as: "customer",
    attributes: ["customerId", "name", "phone"],
  },
  { model: Service, as: "service", attributes: ["serviceId", "name"] },
];

const buildFolio = (saleId) => `V${String(saleId).padStart(6, "0")}`;

const recomputeStatus = (totalAmount, amountPaid) => {
  if (amountPaid >= totalAmount) return "Liquidada";
  return "Con adeudo";
};

// Crea la venta a partir de una cita ya marcada como Completada
export const createSale = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { appointmentId, items, amountPaid, paymentMethod } = req.body;

    if (!appointmentId || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Se requiere la cita y al menos un servicio para registrar la venta",
      });
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
    });

    if (!appointment) {
      await t.rollback();
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    if (appointment.status !== "Completada") {
      await t.rollback();
      return res.status(400).json({
        message:
          "Solo se puede registrar la venta de una cita marcada como Completada",
      });
    }

    const existingSale = await Sale.findOne({
      where: { appointmentId },
      transaction: t,
    });

    if (existingSale) {
      await t.rollback();
      return res.status(400).json({
        message: "Esta cita ya tiene una venta registrada",
      });
    }

    const totalAmount = items.reduce((sum, item) => {
      const unitPrice = Number(item.unitPrice);
      const discount = Number(item.discountPercent) || 0;
      return sum + unitPrice * (1 - discount / 100);
    }, 0);

    const paid = Number(amountPaid) || 0;

    if (paid > totalAmount) {
      await t.rollback();
      return res.status(400).json({
        message: "El monto pagado no puede ser mayor al total de la venta",
      });
    }

    const newSale = await Sale.create(
      {
        folio: "PENDING",
        appointmentId,
        customerId: appointment.customerId,
        userId: appointment.userId,
        marca: appointment.marca,
        totalAmount,
        amountPaid: paid,
        status: recomputeStatus(totalAmount, paid),
      },
      { transaction: t },
    );

    await newSale.update(
      { folio: buildFolio(newSale.saleId) },
      { transaction: t },
    );

    await SaleItem.bulkCreate(
      items.map((item) => ({
        saleId: newSale.saleId,
        serviceId: item.serviceId,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
      })),
      { transaction: t },
    );

    if (paid > 0) {
      await SalePayment.create(
        {
          saleId: newSale.saleId,
          amount: paid,
          paymentMethod: paymentMethod || "Efectivo",
          registeredByUserId: req.user.id,
        },
        { transaction: t },
      );
    }

    // Buscamos la venta completa dentro de la transacción
    const fullSale = await Sale.findByPk(newSale.saleId, {
      include: saleIncludes,
      transaction: t,
    });

    await t.commit();

    res.status(201).json(fullSale);
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Error creating sale:", error);
    res.status(500).json({
      message: "Server error while creating sale",
      error: error.message,
    });
  }
};

// Registra un abono adicional a una venta con adeudo
export const registerPayment = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;

    if (!amount || Number(amount) <= 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "El monto del abono debe ser mayor a cero" });
    }

    const sale = await Sale.findByPk(id, { transaction: t });
    if (!sale) {
      await t.rollback();
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    if (sale.status === "Cancelada") {
      await t.rollback();
      return res.status(400).json({
        message: "No se pueden registrar abonos en una venta cancelada",
      });
    }

    const currentPaid = parseFloat(sale.amountPaid);
    const total = parseFloat(sale.totalAmount);
    const newPaid = currentPaid + Number(amount);

    if (newPaid > total) {
      await t.rollback();
      return res.status(400).json({
        message: `El abono excede el saldo pendiente. Saldo actual: ${(total - currentPaid).toFixed(2)}`,
      });
    }

    await SalePayment.create(
      {
        saleId: sale.saleId,
        amount,
        paymentMethod: paymentMethod || "Efectivo",
        registeredByUserId: req.user.id,
      },
      { transaction: t },
    );

    await sale.update(
      {
        amountPaid: newPaid,
        status: recomputeStatus(total, newPaid),
      },
      { transaction: t },
    );

    await t.commit();

    const fullSale = await Sale.findByPk(id, { include: saleIncludes });
    res.status(200).json(fullSale);
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(500).json({
      message: "Server error while registering payment",
      error: error.message,
    });
  }
};

// Historial de transacciones con filtros de marca y rango de fechas
export const getSalesHistory = async (req, res) => {
  try {
    const {
      marca,
      dateFrom,
      dateTo,
      status,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const saleWhere = { isHidden: false };
    if (marca) saleWhere.marca = marca;
    if (status && ["Liquidada", "Con adeudo", "Cancelada"].includes(status)) {
      saleWhere.status = status;
    }
    if (dateFrom || dateTo) {
      saleWhere.created_at = {};
      if (dateFrom)
        saleWhere.created_at[Op.gte] = new Date(`${dateFrom}T00:00:00`);
      if (dateTo) saleWhere.created_at[Op.lte] = new Date(`${dateTo}T23:59:59`);
    }
    if (search) {
      saleWhere[Op.or] = [
        { folio: { [Op.like]: `%${search}%` } },
        { "$customer.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const packageWhere = { status: { [Op.ne]: "Cancelado" }, isHidden: false };
    if (marca) packageWhere.marca = marca;
    if (status) {
      if (["Activo", "Completado", "Cancelado"].includes(status)) {
        packageWhere.status = status;
      } else if (["Pagado", "Con adeudo"].includes(status)) {
        packageWhere.paymentStatus = status;
      }
    }
    if (dateFrom || dateTo) {
      packageWhere.created_at = {};
      if (dateFrom)
        packageWhere.created_at[Op.gte] = new Date(`${dateFrom}T00:00:00`);
      if (dateTo)
        packageWhere.created_at[Op.lte] = new Date(`${dateTo}T23:59:59`);
    }
    if (search) {
      packageWhere[Op.or] = [
        { "$customer.name$": { [Op.like]: `%${search}%` } },
        { "$service.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const [sales, packages] = await Promise.all([
      Sale.findAll({
        where: saleWhere,
        include: saleIncludes,
        order: [["created_at", "DESC"]],
        subQuery: false,
      }),
      CustomerPackage.findAll({
        where: packageWhere,
        include: packageIncludes,
        order: [["created_at", "DESC"]],
        subQuery: false,
      }),
    ]);

    const combined = [
      ...sales.map((s) => ({ ...s.toJSON(), type: "sale" })),
      ...packages.map((p) => ({ ...p.toJSON(), type: "package" })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at) -
        new Date(a.createdAt || a.created_at),
    );

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const total = combined.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const offset = (pageNum - 1) * limitNum;
    const pageItems = combined.slice(offset, offset + limitNum);

    res.status(200).json({
      sales: pageItems.filter((i) => i.type === "sale"),
      packages: pageItems.filter((i) => i.type === "package"),
      total,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching sales history",
      error: error.message,
    });
  }
};

const buildSalesPdfBuffer = async ({
  marca,
  dateFrom,
  dateTo,
  search,
  generatedByName,
}) => {
  const where = { isHidden: false };
  if (marca) where.marca = marca;

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) where.created_at[Op.lte] = new Date(`${dateTo}T23:59:59`);
  }

  if (search) {
    where[Op.or] = [
      { folio: { [Op.like]: `%${search}%` } },
      { "$customer.name$": { [Op.like]: `%${search}%` } },
    ];
  }

  const sales = await Sale.findAll({
    where,
    include: saleIncludes,
    order: [["created_at", "ASC"]],
    subQuery: false,
  });

  const packages = await CustomerPackage.findAll({
    where: {
      status: { [Op.ne]: "Cancelado" },
      isHidden: false,
      created_at: where.created_at,
      ...(marca ? { marca } : {}),
    },
    include: packageIncludes,
    order: [["created_at", "ASC"]],
    subQuery: false,
  });

  const totalIncome =
    sales.reduce((sum, s) => sum + parseFloat(s.amountPaid), 0) +
    packages.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const pendingBalance =
    sales.reduce(
      (sum, s) => sum + (parseFloat(s.totalAmount) - parseFloat(s.amountPaid)),
      0,
    ) +
    packages.reduce(
      (sum, p) => sum + (parseFloat(p.totalPrice) - parseFloat(p.amountPaid)),
      0,
    );

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v || 0);

  const formatDate = (v) =>
    new Date(v).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateShort = (v) => {
    if (!v) return "—";
    const [year, month, day] = v.split("-");
    return `${day}/${month}/${year}`;
  };

  const reportTitle = marca
    ? `Reporte de Ingresos — ${marca}`
    : "Reporte General de Ingresos";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const black = "#111111";
    const gray = "#444444";
    const lightGray = "#e5e5e5";

    // Encabezado institucional
    doc
      .fontSize(18)
      .fillColor(black)
      .text("Depilclinik — " + reportTitle, {
        align: "left",
      });
    doc
      .fontSize(9)
      .fillColor(gray)
      .text(
        "Clínica de Belleza y Depilación | Paseo de Las Palmas 6, Real del Prado, Durango, Dgo.",
      );

    doc.moveDown(0.3);
    doc
      .fontSize(9)
      .fillColor(gray)
      .text(
        `Sucursal / Marca: Sucursal 1${marca ? ` — ${marca}` : " — Todas las marcas"}   |   Generado por: ${generatedByName || "Administrador"}`,
      );
    doc.text(
      `Rango de Fechas: ${formatDateShort(dateFrom)} al ${formatDateShort(dateTo)}   |   Fecha de Emisión: ${new Date().toLocaleString("es-MX")}`,
    );

    doc.moveDown(1);

    const columns = [
      { label: "Folio", width: 70 },
      { label: "Fecha", width: 80 },
      { label: "Cliente", width: 150 },
      { label: "Tratamiento", width: 260 },
      { label: "Monto", width: 90 },
      { label: "Estado", width: 90 },
    ];
    const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
    const left = doc.page.margins.left;

    const drawHeaderRow = (y) => {
      doc.rect(left, y, tableWidth, 20).fill(black);
      doc.fillColor("#ffffff").fontSize(9);
      let x = left;
      columns.forEach((col) => {
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });
        x += col.width;
      });
      return y + 20;
    };

    let y = drawHeaderRow(doc.y);
    doc.fontSize(8.5);

    const records = [
      ...sales.map((sale) => ({
        type: "sale",
        id: sale.saleId,
        folio: sale.folio,
        date: sale.createdAt || sale.created_at,
        customerName: sale.customer?.name || "—",
        treatment:
          sale.items
            ?.map((i) => i.service?.name)
            .filter(Boolean)
            .join(", ") || "—",
        amount: sale.totalAmount,
        status: sale.status,
      })),
      ...packages.map((pkg) => ({
        type: "package",
        id: pkg.packageId,
        folio: `PKG${pkg.packageId}`,
        date: pkg.createdAt || pkg.created_at,
        customerName: pkg.customer?.name || "—",
        treatment: pkg.service?.name || "—",
        amount: pkg.totalPrice,
        status: pkg.paymentStatus,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    records.forEach((record, index) => {
      if (y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage({ layout: "landscape" });
        y = drawHeaderRow(doc.page.margins.top);
      }

      if (index % 2 === 0) {
        doc.rect(left, y, tableWidth, 18).fill(lightGray);
      }
      doc.fillColor(black);

      const rowData = [
        record.folio,
        formatDate(record.date),
        record.customerName,
        record.treatment,
        formatCurrency(record.amount),
        record.status,
      ];

      let x = left;
      rowData.forEach((val, i) => {
        doc.text(String(val), x + 4, y + 4, {
          width: columns[i].width - 8,
          ellipsis: true,
        });
        x += columns[i].width;
      });

      y += 18;
    });

    y += 20;
    if (y > doc.page.height - doc.page.margins.bottom - 80) {
      doc.addPage({ layout: "landscape" });
      y = doc.page.margins.top;
    }

    doc
      .moveTo(left, y)
      .lineTo(left + tableWidth, y)
      .strokeColor(black)
      .stroke();
    y += 10;

    doc
      .fontSize(10)
      .fillColor(black)
      .text("RESUMEN FINANCIERO DEL PERIODO", left, y);
    y += 18;

    doc.fontSize(10).fillColor(black);
    doc.text(
      `Total de ingresos cobrados: ${formatCurrency(totalIncome)} MXN`,
      left,
      y,
    );
    y += 16;

    doc.text(
      `Saldos pendientes: ${formatCurrency(pendingBalance)} MXN`,
      left,
      y,
    );
    y += 16;

    doc.text(`Total de transacciones en el rango: ${records.length}`, left, y);
    y += 24;

    y += 60;
    doc
      .fontSize(7.5)
      .fillColor(gray)
      .text(
        "Este documento es un reporte financiero generado automáticamente por el sistema de gestión de Depilclinik (depilclinik.com).",
        left,
        y,
        { width: tableWidth, align: "center" },
      );

    doc.end();
  });
};

// Genera un reporte PDF de ventas respetando los mismos filtros del historial
export const exportSalesPdf = async (req, res) => {
  try {
    const { marca, search } = req.query;
    let { dateFrom, dateTo } = req.query;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (dateTo && dateTo > todayStr) {
      dateTo = todayStr;
    }

    const buffer = await buildSalesPdfBuffer({
      marca,
      dateFrom,
      dateTo,
      search,
      generatedByName: req.user?.name || "Administrador",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-ingresos-${Date.now()}.pdf"`,
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generando PDF de ventas:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error while generating PDF report",
        error: error.message,
      });
    }
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findByPk(id, { include: saleIncludes });

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching sale",
      error: error.message,
    });
  }
};

// Ingresos del día (Dashboard)
export const getTodayIncome = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const salesIncome = await Sale.sum("amountPaid", {
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: { [Op.ne]: "Cancelada" },
        isHidden: false,
      },
    });

    const hiddenPackages = await CustomerPackage.findAll({
      where: { isHidden: true },
      attributes: ["packageId"],
    });
    const hiddenPackageIds = hiddenPackages.map((p) => p.packageId);

    const packageIncome = await PackagePayment.sum("amount", {
      where: {
        paid_at: { [Op.between]: [startOfDay, endOfDay] },
        ...(hiddenPackageIds.length > 0
          ? { packageId: { [Op.notIn]: hiddenPackageIds } }
          : {}),
      },
    });

    res.status(200).json({
      totalIncome: (salesIncome || 0) + (packageIncome || 0),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching today's income",
      error: error.message,
    });
  }
};

// Ingresos para un rango de fechas + marca (Admin, filtrable)
export const getIncomeForRange = async (req, res) => {
  try {
    const { startDate, endDate, marca } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Se requiere un rango de fechas" });
    }
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const saleWhere = {
      created_at: { [Op.between]: [start, end] },
      status: { [Op.ne]: "Cancelada" },
      isHidden: false,
    };
    if (marca) saleWhere.marca = marca;

    const salesIncome =
      (await Sale.sum("amountPaid", {
        where: saleWhere,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [],
            where: { isHidden: false },
          },
        ],
      })) || 0;

    const hiddenPackages = await CustomerPackage.findAll({
      where: { isHidden: true },
      attributes: ["packageId"],
    });
    const hiddenPackageIds = hiddenPackages.map((p) => p.packageId);

    let packageIncome;
    if (marca) {
      const packagesOfBrand = await CustomerPackage.findAll({
        where: { marca, isHidden: false },
        attributes: ["packageId"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [],
            where: { isHidden: false },
          },
        ],
      });
      const brandPackageIds = packagesOfBrand.map((p) => p.packageId);
      packageIncome = brandPackageIds.length
        ? (await PackagePayment.sum("amount", {
            where: {
              paid_at: { [Op.between]: [start, end] },
              packageId: { [Op.in]: brandPackageIds },
            },
          })) || 0
        : 0;
    } else {
      const visiblePackages = await CustomerPackage.findAll({
        where: { isHidden: false },
        attributes: ["packageId"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: [],
            where: { isHidden: false },
          },
        ],
      });
      const visiblePackageIds = visiblePackages.map((p) => p.packageId);
      packageIncome = visiblePackageIds.length
        ? (await PackagePayment.sum("amount", {
            where: {
              paid_at: { [Op.between]: [start, end] },
              packageId: { [Op.in]: visiblePackageIds },
            },
          })) || 0
        : 0;
    }

    res.status(200).json({ totalIncome: salesIncome + packageIncome });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching income for range",
      error: error.message,
    });
  }
};

// Ingresos día por día, separados por marca, para graficar en el Dashboard
export const getDailyIncomeForRange = async (req, res) => {
  try {
    const { startDate, endDate, marca } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Se requiere un rango de fechas" });
    }
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const saleWhere = {
      created_at: { [Op.between]: [start, end] },
      status: { [Op.ne]: "Cancelada" },
      isHidden: false,
    };
    if (marca) saleWhere.marca = marca;

    const sales = await Sale.findAll({
      where: saleWhere,
      attributes: ["marca", "amountPaid", "created_at"],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: [],
          where: { isHidden: false },
        },
      ],
    });

    const hiddenPackages = await CustomerPackage.findAll({
      where: { isHidden: true },
      attributes: ["packageId"],
    });
    const hiddenPackageIds = hiddenPackages.map((p) => p.packageId);

    const packageWhere = { isHidden: false };
    if (marca) packageWhere.marca = marca;
    const packages = await CustomerPackage.findAll({
      where: packageWhere,
      attributes: ["packageId", "marca"],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: [],
          where: { isHidden: false },
        },
      ],
    });

    const packageBrandMap = new Map();
    packages.forEach((p) => {
      packageBrandMap.set(Number(p.packageId), p.marca);
      packageBrandMap.set(String(p.packageId), p.marca);
    });

    const paymentWhere = {
      paid_at: { [Op.between]: [start, end] },
      ...(hiddenPackageIds.length > 0
        ? { packageId: { [Op.notIn]: hiddenPackageIds } }
        : {}),
      ...(marca
        ? { packageId: { [Op.in]: packages.map((p) => p.packageId) } }
        : {}),
    };
    const payments = await PackagePayment.findAll({
      where: paymentWhere,
      attributes: ["packageId", "amount", "paid_at"],
      raw: true,
    });

    const dayMap = new Map();

    const addToDay = (dateValue, brand, amount) => {
      const d = new Date(dateValue);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, { date: key, "Modelha DK": 0, Depilclinik: 0 });
      }
      const entry = dayMap.get(key);
      entry[brand] = (entry[brand] || 0) + Number(amount);
    };

    sales.forEach((s) => addToDay(s.created_at, s.marca, s.amountPaid));

    payments.forEach((p) => {
      let brand =
        packageBrandMap.get(p.packageId) ||
        packageBrandMap.get(Number(p.packageId)) ||
        packageBrandMap.get(String(p.packageId));
      if (brand) {
        addToDay(p.paid_at, brand, p.amount);
      }
    });

    const result = [];
    const [startY, startM, startD] = startDate.split("-").map(Number);
    const [endY, endM, endD] = endDate.split("-").map(Number);
    const cursor = new Date(startY, startM - 1, startD);
    const endMarker = new Date(endY, endM - 1, endD);

    while (cursor <= endMarker) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      const day = `${y}-${m}-${d}`;
      result.push(
        dayMap.get(day) || { date: day, "Modelha DK": 0, Depilclinik: 0 },
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching daily income",
      error: error.message,
    });
  }
};

// Resumen mensual (Ingresos page): totales, saldos pendientes, ventas concluidas
export const getMonthlySummary = async (req, res) => {
  try {
    const { year, month, marca } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Se requiere año y mes" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const saleWhere = {
      created_at: { [Op.between]: [startDate, endDate] },
      isHidden: false,
    };
    if (marca) saleWhere.marca = marca;

    const sales = await Sale.findAll({ where: saleWhere });

    const hiddenPackages = await CustomerPackage.findAll({
      where: { isHidden: true },
      attributes: ["packageId"],
    });
    const hiddenPackageIds = hiddenPackages.map((p) => p.packageId);

    const packageIncome = await PackagePayment.sum("amount", {
      where: {
        paid_at: { [Op.between]: [startDate, endDate] },
        ...(hiddenPackageIds.length > 0
          ? { packageId: { [Op.notIn]: hiddenPackageIds } }
          : {}),
      },
    });
    const packageWhere = {
      paymentStatus: "Con adeudo",
      status: { [Op.ne]: "Cancelado" },
      isHidden: false,
    };
    if (marca) packageWhere.marca = marca;

    const packagesWithDebt = await CustomerPackage.findAll({
      where: packageWhere,
    });

    const packageTotalWhere = {
      status: { [Op.ne]: "Cancelado" },
      isHidden: false,
      created_at: { [Op.between]: [startDate, endDate] },
    };
    if (marca) packageTotalWhere.marca = marca;

    const totalPackageCount = await CustomerPackage.count({
      where: packageTotalWhere,
    });

    const completedPackageCount = await CustomerPackage.count({
      where: {
        paymentStatus: "Pagado",
        status: { [Op.ne]: "Cancelado" },
        isHidden: false,
        created_at: { [Op.between]: [startDate, endDate] },
        ...(marca ? { marca } : {}),
      },
    });

    const totalIncome =
      sales.reduce((sum, s) => sum + parseFloat(s.amountPaid), 0) +
      (packageIncome || 0);
    const pendingBalance =
      sales.reduce(
        (sum, s) =>
          sum + (parseFloat(s.totalAmount) - parseFloat(s.amountPaid)),
        0,
      ) +
      packagesWithDebt.reduce(
        (sum, p) => sum + (parseFloat(p.totalPrice) - parseFloat(p.amountPaid)),
        0,
      );
    const completedSales =
      sales.filter((s) => s.status === "Liquidada").length +
      completedPackageCount;

    res.status(200).json({
      totalIncome,
      pendingBalance,
      completedSales,
      totalSales: sales.length + totalPackageCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching monthly summary",
      error: error.message,
    });
  }
};

// 1. Obtener todas las ventas con adeudo pendiente (Para el módulo Cuentas por Cobrar)
export const getPendingAccounts = async (req, res) => {
  try {
    const { search, marca } = req.query;
    const saleWhere = { status: "Con adeudo", isHidden: false };

    if (marca) saleWhere.marca = marca;
    if (search) {
      saleWhere[Op.or] = [
        { folio: { [Op.like]: `%${search}%` } },
        { "$customer.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const pendingSales = await Sale.findAll({
      where: saleWhere,
      include: saleIncludes,
      order: [["created_at", "ASC"]],
      subQuery: false,
      distinct: true,
    });

    const packageWhere = {
      paymentStatus: "Con adeudo",
      status: { [Op.ne]: "Cancelado" },
      isHidden: false,
    };
    if (marca) packageWhere.marca = marca;
    if (search) {
      packageWhere[Op.or] = [
        { "$customer.name$": { [Op.like]: `%${search}%` } },
        { "$service.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const pendingPackages = await CustomerPackage.findAll({
      where: packageWhere,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name", "phone"],
        },
        {
          model: Service,
          as: "service",
          attributes: ["serviceId", "name"],
        },
      ],
      order: [["created_at", "ASC"]],
      subQuery: false,
    });

    res.status(200).json({ pendingSales, pendingPackages });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las cuentas por cobrar",
      error: error.message,
    });
  }
};

// 2. Obtener los adeudos de un cliente específico (Para la ficha del cliente)
export const getCustomerPendingDebts = async (req, res) => {
  try {
    const { customerId } = req.params;

    const debts = await Sale.findAll({
      where: {
        customerId,
        status: "Con adeudo",
        isHidden: false,
      },
      include: saleIncludes,
    });

    res.status(200).json(debts);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar adeudos del cliente",
      error: error.message,
    });
  }
};

export { buildSalesPdfBuffer };
