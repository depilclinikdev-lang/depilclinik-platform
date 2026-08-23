import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Customer from "./Customer.js";
import Service from "./Service.js";
import User from "./User.js";
import MedicalAssessment from "./MedicalAssessment.js";
import LaserMedicalAssessment from "./LaserMedicalAssessment.js";
import Sale from "./Sale.js";
import WhatsappNotification from "./WhatsappNotification.js";

const Appointment = sequelize.define(
  "Appointment",
  {
    appointmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "appointment_id",
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
    },
    marca: {
      type: DataTypes.ENUM("Modelha DK", "Depilclinik"),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "end_time",
    },
    status: {
      type: DataTypes.ENUM(
        "Programada",
        "Confirmada",
        "En Tratamiento",
        "Completada",
        "Cancelada",
      ),
      allowNull: false,
      defaultValue: "Programada",
    },
    isNewClientPendingData: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_new_client_pending_data",
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_hidden",
    },
  },
  {
    tableName: "Appointments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

Appointment.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Appointment.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
Appointment.belongsTo(User, { foreignKey: "userId", as: "collaborator" });

Appointment.hasOne(MedicalAssessment, {
  foreignKey: "appointmentId",
  as: "medicalAssessment",
});
MedicalAssessment.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

Appointment.hasOne(LaserMedicalAssessment, {
  foreignKey: "appointmentId",
  as: "laserAssessment",
});
LaserMedicalAssessment.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

Appointment.hasOne(Sale, {
  foreignKey: "appointmentId",
  as: "sale",
});
Sale.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

Appointment.hasOne(WhatsappNotification, {
  foreignKey: "appointmentId",
  as: "whatsappNotification",
});
WhatsappNotification.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

export default Appointment;
