import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AssessmentPackageSnapshot = sequelize.define(
  "AssessmentPackageSnapshot",
  {
    snapshotId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "snapshot_id",
    },
    assessmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "assessment_id",
    },
    laserAssessmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "laser_assessment_id",
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "package_id",
    },
    snapshotType: {
      type: DataTypes.ENUM("Baseline", "Final"),
      allowNull: false,
      field: "snapshot_type",
    },
    snapshotData: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "snapshot_data",
    },
  },
  {
    tableName: "Assessment_Package_Snapshots",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default AssessmentPackageSnapshot;