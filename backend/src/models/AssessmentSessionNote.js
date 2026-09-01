import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AssessmentSessionNote = sequelize.define(
  "AssessmentSessionNote",
  {
    noteId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "note_id",
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
    noteDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "note_date",
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "package_id",
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "session_number",
    },
    noteText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "note_text",
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by_user_id",
    },
  },
  {
    tableName: "Assessment_Session_Notes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

export default AssessmentSessionNote;
