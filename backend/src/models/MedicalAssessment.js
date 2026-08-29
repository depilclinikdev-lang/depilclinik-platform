import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import AssessmentProfessionalTreatment from "./AssessmentProfessionalTreatment.js";
import GynecoObstetricRecord from "./GynecoObstetricRecord.js";
import DailySkincareRoutine from "./DailySkincareRoutine.js";
import LifestyleHabit from "./LifestyleHabit.js";
import PatientDietRating from "./PatientDietRating.js";
import PatientSkinPractice from "./PatientSkinPractice.js";
import PatientMedicalBackground from "./PatientMedicalBackground.js";
import PatientAllergiesRecord from "./PatientAllergiesRecord.js";
import BodyEvaluation from "./BodyEvaluation.js";
import FacialEvaluation from "./FacialEvaluation.js";
import Service from "./Service.js";

const MedicalAssessment = sequelize.define(
  "MedicalAssessment",
  {
    assessmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "assessment_id",
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
    consultationReason: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "consultation_reason",
    },
    onsetDateDetails: {
      type: DataTypes.STRING(250),
      allowNull: true,
      field: "onset_date_details",
    },
    knownCause: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "known_cause",
    },
    previousCare: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "previous_care",
    },
    bloodType: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: "blood_type",
    },
    residenceTime: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "residence_time",
    },
    temperatureC: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      field: "temperature_c",
    },
    bloodPressure: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "blood_pressure",
    },
    oxygenSaturation: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "oxygen_saturation",
    },
    heartRateBpm: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "heart_rate_bpm",
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
    professionalAssessment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "professional_assessment",
    },
    hasSignedConsent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
    tableName: "Medical_Assessments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

MedicalAssessment.hasMany(AssessmentProfessionalTreatment, {
  foreignKey: "assessmentId",
  as: "professionalTreatments",
  onDelete: "CASCADE",
});
AssessmentProfessionalTreatment.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(GynecoObstetricRecord, {
  foreignKey: "assessmentId",
  as: "gynecoRecord",
  onDelete: "CASCADE",
});
GynecoObstetricRecord.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(DailySkincareRoutine, {
  foreignKey: "assessmentId",
  as: "skincareRoutine",
  onDelete: "CASCADE",
});
DailySkincareRoutine.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(LifestyleHabit, {
  foreignKey: "assessmentId",
  as: "lifestyleHabit",
  onDelete: "CASCADE",
});
LifestyleHabit.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasMany(PatientDietRating, {
  foreignKey: "assessmentId",
  as: "dietRatings",
  onDelete: "CASCADE",
});
PatientDietRating.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasMany(PatientSkinPractice, {
  foreignKey: "assessmentId",
  as: "skinPractices",
  onDelete: "CASCADE",
});
PatientSkinPractice.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(PatientMedicalBackground, {
  foreignKey: "assessmentId",
  as: "medicalBackground",
  onDelete: "CASCADE",
});
PatientMedicalBackground.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(PatientAllergiesRecord, {
  foreignKey: "assessmentId",
  as: "allergiesRecord",
  onDelete: "CASCADE",
});
PatientAllergiesRecord.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(BodyEvaluation, {
  foreignKey: "assessmentId",
  as: "bodyEvaluation",
  onDelete: "CASCADE",
});
BodyEvaluation.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.hasOne(FacialEvaluation, {
  foreignKey: "assessmentId",
  as: "facialEvaluation",
  onDelete: "CASCADE",
});
FacialEvaluation.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});

MedicalAssessment.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

export default MedicalAssessment;
