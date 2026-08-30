import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import ObstetricHistoryDetail from "./ObstetricHistoryDetail.js";

const GynecoObstetricRecord = sequelize.define(
  "GynecoObstetricRecord",
  {
    gynecoId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "gyneco_id",
    },
    assessmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "assessment_id",
    },
    periodStartAge: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "period_start_age",
    },
    menopauseStartAge: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "menopause_start_age",
    },
    lastPeriodDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "last_period_date",
    },
    periodType: {
      type: DataTypes.ENUM("Regular", "Irregular", "Colicos", "Antojos"),
      allowNull: true,
      field: "period_type",
    },
    contraceptiveMethod: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "contraceptive_method",
    },
    emergencyContraceptive: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "emergency_contraceptive",
    },
  },
  {
    tableName: "Gyneco_Obstetric_Records",
    timestamps: false,
  },
);

GynecoObstetricRecord.hasMany(ObstetricHistoryDetail, {
  foreignKey: "gynecoId",
  as: "obstetricDetails",
  onDelete: "CASCADE",
});
ObstetricHistoryDetail.belongsTo(GynecoObstetricRecord, {
  foreignKey: "gynecoId",
  as: "gynecoRecord",
});

export default GynecoObstetricRecord;
