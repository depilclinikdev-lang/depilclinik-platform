import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PackageSession = sequelize.define(
  "PackageSession",
  {
    packageSessionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "package_session_id",
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "package_id",
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "session_number",
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "appointment_id",
    },
    status: {
      type: DataTypes.ENUM("Pendiente", "Agendada", "Completada", "Cancelada"),
      allowNull: false,
      defaultValue: "Pendiente",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completed_at",
    },
  },
  {
    tableName: "Package_Sessions",
    timestamps: false,
  },
);

export default PackageSession;
