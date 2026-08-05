// backend/src/models/index.js
import sequelize from "../config/db.js";

import User from "./User.js";
import Customer from "./Customer.js";
import Service from "./Service.js";
import ServiceInclusion from "./ServiceInclusion.js";
import Appointment from "./Appointment.js";

import MedicalAssessment from "./MedicalAssessment.js";
import AssessmentProfessionalTreatment from "./AssessmentProfessionalTreatment.js";
import GynecoObstetricRecord from "./GynecoObstetricRecord.js";
import ObstetricHistoryDetail from "./ObstetricHistoryDetail.js";
import ModelhaEvolutionLog from "./ModelhaEvolutionLog.js";
import DailySkincareRoutine from "./DailySkincareRoutine.js";
import LifestyleHabit from "./LifestyleHabit.js";
import PatientDietRating from "./PatientDietRating.js";
import PatientSkinPractice from "./PatientSkinPractice.js";
import PatientMedicalBackground from "./PatientMedicalBackground.js";
import PatientAllergiesRecord from "./PatientAllergiesRecord.js";
import BodyEvaluation from "./BodyEvaluation.js";
import FacialEvaluation from "./FacialEvaluation.js";

import LaserMedicalAssessment from "./LaserMedicalAssessment.js";
import LaserAreaOfInterest from "./LaserAreaOfInterest.js";
import LaserClinicalCondition from "./LaserClinicalCondition.js";
import LaserEvolutionLog from "./LaserEvolutionLog.js";

import AssessmentPhoto from "./AssessmentPhoto.js";

import Sale from "./Sale.js";
import SaleItem from "./SaleItem.js";
import SalePayment from "./SalePayment.js";

import WhatsappNotification from "./WhatsappNotification.js";

// Asociaciones que faltan por conectar (ver punto 3 más abajo)
MedicalAssessment.hasMany(ModelhaEvolutionLog, {
  foreignKey: "assessmentId",
  as: "evolutionLogs",
});
ModelhaEvolutionLog.belongsTo(MedicalAssessment, {
  foreignKey: "assessmentId",
  as: "assessment",
});
Appointment.hasMany(ModelhaEvolutionLog, {
  foreignKey: "appointmentId",
  as: "modelhaEvolutionLogs",
});
ModelhaEvolutionLog.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

LaserMedicalAssessment.hasMany(LaserEvolutionLog, {
  foreignKey: "laserAssessmentId",
  as: "evolutionLogs",
});
LaserEvolutionLog.belongsTo(LaserMedicalAssessment, {
  foreignKey: "laserAssessmentId",
  as: "laserAssessment",
});
Appointment.hasMany(LaserEvolutionLog, {
  foreignKey: "appointmentId",
  as: "laserEvolutionLogs",
});
LaserEvolutionLog.belongsTo(Appointment, {
  foreignKey: "appointmentId",
  as: "appointment",
});

export {
  sequelize,
  User,
  Customer,
  Service,
  ServiceInclusion,
  Appointment,
  MedicalAssessment,
  AssessmentProfessionalTreatment,
  GynecoObstetricRecord,
  ObstetricHistoryDetail,
  ModelhaEvolutionLog,
  DailySkincareRoutine,
  LifestyleHabit,
  PatientDietRating,
  PatientSkinPractice,
  PatientMedicalBackground,
  PatientAllergiesRecord,
  BodyEvaluation,
  FacialEvaluation,
  LaserMedicalAssessment,
  LaserAreaOfInterest,
  LaserClinicalCondition,
  LaserEvolutionLog,
  AssessmentPhoto,
  Sale,
  SaleItem,
  SalePayment,
  WhatsappNotification,
};

export default sequelize;
