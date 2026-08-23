import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const boolField = (fieldName) => ({
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: fieldName,
});

const decimalField = (fieldName, precision = 5, scale = 2) => ({
  type: DataTypes.DECIMAL(precision, scale),
  allowNull: true,
  field: fieldName,
});

const BodyEvaluation = sequelize.define(
  "BodyEvaluation",
  {
    bodyEvalId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "body_eval_id",
    },
    assessmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "assessment_id",
    },
    weightKg: decimalField("weight_kg"),
    heightCm: decimalField("height_cm"),
    waistCm: decimalField("waist_cm"),
    abdomenCm: decimalField("abdomen_cm"),
    hipCm: decimalField("hip_cm"),
    armsCm: decimalField("arms_cm"),
    legCm: decimalField("leg_cm"),
    bmi: decimalField("bmi", 4, 1),
    bicipitalFoldMm: decimalField("bicipital_fold_mm", 4, 1),
    tricipitalFoldMm: decimalField("tricipital_fold_mm", 4, 1),
    abdominalFoldMm: decimalField("abdominal_fold_mm", 4, 1),
    subiliacFoldMm: decimalField("subiliac_fold_mm", 4, 1),
    crestFoldMm: decimalField("crest_fold_mm", 4, 1),
    scapularFoldMm: decimalField("scapular_fold_mm", 4, 1),
    thighFoldMm: decimalField("thigh_fold_mm", 4, 1),

    fatAbdomen: boolField("fat_abdomen"),
    fatWaist: boolField("fat_waist"),
    fatHips: boolField("fat_hips"),
    fatThighs: boolField("fat_thighs"),
    fatLegs: boolField("fat_legs"),
    fatArms: boolField("fat_arms"),
    fatUpperBack: boolField("fat_upper_back"),
    fatLowerBack: boolField("fat_lower_back"),
    fatChin: boolField("fat_chin"),

    celluliteAbdomen: boolField("cellulite_abdomen"),
    celluliteWaist: boolField("cellulite_waist"),
    celluliteHips: boolField("cellulite_hips"),
    celluliteThighs: boolField("cellulite_thighs"),
    celluliteLegs: boolField("cellulite_legs"),
    celluliteArms: boolField("cellulite_arms"),
    celluliteUpperBack: boolField("cellulite_upper_back"),
    celluliteLowerBack: boolField("cellulite_lower_back"),
    celluliteChin: boolField("cellulite_chin"),
    celluliteTexture: {
      type: DataTypes.ENUM("Flacida", "Compacta", "Mixta", "Edematosa"),
      allowNull: true,
      field: "cellulite_texture",
    },
    celluliteGrade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "cellulite_grade",
    },

    stretchmarksAbdomen: boolField("stretchmarks_abdomen"),
    stretchmarksWaist: boolField("stretchmarks_waist"),
    stretchmarksHips: boolField("stretchmarks_hips"),
    stretchmarksThighs: boolField("stretchmarks_thighs"),
    stretchmarksLegs: boolField("stretchmarks_legs"),
    stretchmarksArms: boolField("stretchmarks_arms"),
    stretchmarksUpperBack: boolField("stretchmarks_upper_back"),
    stretchmarksLowerBack: boolField("stretchmarks_lower_back"),
    stretchmarksChin: boolField("stretchmarks_chin"),

    varicesSmall: boolField("varices_small"),
    varicesVisible: boolField("varices_visible"),
    varicesEdema: boolField("varices_edema"),
    varicesUlcers: boolField("varices_ulcers"),
    varicesDiscoloration: boolField("varices_discoloration"),
    varicesTelangiectasias: boolField("varices_telangiectasias"),

    bodyDiagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "body_diagnosis",
    },
  },
  {
    tableName: "Body_Evaluations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default BodyEvaluation;
