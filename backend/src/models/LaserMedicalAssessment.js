import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import LaserAreaOfInterest from "./LaserAreaOfInterest.js";
import LaserClinicalCondition from "./LaserClinicalCondition.js";
import Service from "./Service.js";

const LaserMedicalAssessment = sequelize.define(
  "LaserMedicalAssessment",
  {
    laserAssessmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "laser_assessment_id",
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "customer_id",
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "appointment_id",
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "service_id",
    },
    serviceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "service_date",
    },
    referredMedia: {
      type: DataTypes.ENUM(
        "Instagram",
        "Facebook",
        "TikTok",
        "Recomendacion",
        "Por su cuenta",
        "Otro",
      ),
      allowNull: false,
      field: "referred_media",
    },
    hasDiseases: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_diseases",
    },
    diseasesNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "diseases_notes",
    },
    hasMedications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_medications",
    },
    medicationsNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "medications_notes",
    },
    hasTattoos: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_tattoos",
    },
    tattoosNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "tattoos_notes",
    },
    hasAllergies: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_allergies",
    },
    allergiesNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "allergies_notes",
    },
    hasAestheticProcedures: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_aesthetic_procedures",
    },
    aestheticsProceduresNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "aesthetics_procedures_notes",
    },
    hasSignedConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_signed_consent",
    },
    consentPdfUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: "consent_pdf_url",
    },
    filledByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "filled_by_user_id",
    },
    performedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "performed_by_user_id",
    },
    filledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "filled_at",
    },
    lockedForCollaborator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "locked_for_collaborator",
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_hidden",
    },
  },
  {
    tableName: "Laser_Medical_Assessments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

LaserMedicalAssessment.hasMany(LaserAreaOfInterest, {
  foreignKey: "laserAssessmentId",
  as: "areasOfInterest",
  onDelete: "CASCADE",
});
LaserAreaOfInterest.belongsTo(LaserMedicalAssessment, {
  foreignKey: "laserAssessmentId",
  as: "laserAssessment",
});

LaserMedicalAssessment.hasOne(LaserClinicalCondition, {
  foreignKey: "laserAssessmentId",
  as: "clinicalConditions",
  onDelete: "CASCADE",
});
LaserClinicalCondition.belongsTo(LaserMedicalAssessment, {
  foreignKey: "laserAssessmentId",
  as: "laserAssessment",
});
LaserMedicalAssessment.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

export default LaserMedicalAssessment;
