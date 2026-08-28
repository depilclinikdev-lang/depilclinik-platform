import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Customer from "./Customer.js";
import User from "./User.js";
import SaleItem from "./SaleItem.js";
import SalePayment from "./SalePayment.js";

const Sale = sequelize.define(
  "Sale",
  {
    saleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "sale_id",
    },
    folio: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "appointment_id",
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "customer_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    marca: {
      type: DataTypes.ENUM("Modelha DK", "Depilclinik"),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_amount",
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "amount_paid",
    },
    status: {
      type: DataTypes.ENUM("Liquidada", "Con adeudo", "Cancelada"),
      allowNull: false,
      defaultValue: "Con adeudo",
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_hidden",
    },
    balance: {
      type: DataTypes.VIRTUAL,
      get() {
        const total = parseFloat(this.getDataValue("totalAmount")) || 0;
        const paid = parseFloat(this.getDataValue("amountPaid")) || 0;
        return total - paid;
      },
    },
  },
  {
    tableName: "Sales",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

Sale.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Sale, { foreignKey: "customerId", as: "sales" });

Sale.belongsTo(User, { foreignKey: "userId", as: "collaborator" });
User.hasMany(Sale, { foreignKey: "userId", as: "sales" });

Sale.hasMany(SaleItem, {
  foreignKey: "saleId",
  as: "items",
  onDelete: "CASCADE",
});
SaleItem.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });

Sale.hasMany(SalePayment, {
  foreignKey: "saleId",
  as: "payments",
  onDelete: "CASCADE",
});
SalePayment.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });

export default Sale;
