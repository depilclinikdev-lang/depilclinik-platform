import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import PackageSession from "./PackageSession.js";
import PackagePayment from "./PackagePayment.js";

const CustomerPackage = sequelize.define(
  "CustomerPackage",
  {
    packageId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "package_id",
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "customer_id",
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "service_id",
    },
    marca: {
      type: DataTypes.ENUM("Modelha DK", "Depilclinik"),
      allowNull: false,
    },
    totalSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "total_sessions",
    },
    sessionsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "sessions_completed",
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_price",
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "amount_paid",
    },
    paymentStatus: {
      type: DataTypes.ENUM("Pagado", "Con adeudo"),
      allowNull: false,
      defaultValue: "Con adeudo",
      field: "payment_status",
    },
    status: {
      type: DataTypes.ENUM("Activo", "Completado", "Cancelado"),
      allowNull: false,
      defaultValue: "Activo",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    soldByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "sold_by_user_id",
    },
    balance: {
      type: DataTypes.VIRTUAL,
      get() {
        const total = parseFloat(this.getDataValue("totalPrice")) || 0;
        const paid = parseFloat(this.getDataValue("amountPaid")) || 0;
        return total - paid;
      },
    },
  },
  {
    tableName: "Customer_Packages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

CustomerPackage.hasMany(PackageSession, {
  foreignKey: "packageId",
  as: "sessions",
  onDelete: "CASCADE",
});
PackageSession.belongsTo(CustomerPackage, {
  foreignKey: "packageId",
  as: "package",
});

CustomerPackage.hasMany(PackagePayment, {
  foreignKey: "packageId",
  as: "payments",
  onDelete: "CASCADE",
});
PackagePayment.belongsTo(CustomerPackage, {
  foreignKey: "packageId",
  as: "package",
});

export default CustomerPackage;
