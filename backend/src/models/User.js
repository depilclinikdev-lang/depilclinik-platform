import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import MedicalAssessment from "./MedicalAssessment.js";
import LaserMedicalAssessment from "./LaserMedicalAssessment.js";
import AssessmentPhoto from "./AssessmentPhoto.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "user_id",
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      field: "public_id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("H", "M", "ND"),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jobPosition: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "job_position",
    },
    emergencyContactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "emergency_contact_name",
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "emergency_contact_phone",
    },
    medicalInsuranceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "medical_insurance_number",
    },
    role: {
      type: DataTypes.ENUM("Administrador", "Colaborador"),
      allowNull: false,
      defaultValue: "Colaborador",
      field: "rol",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "must_change_password",
    },
  },
  {
    tableName: "Users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

User.hasMany(MedicalAssessment, {
  foreignKey: "filledByUserId",
  as: "filledMedicalAssessments",
});
MedicalAssessment.belongsTo(User, {
  foreignKey: "filledByUserId",
  as: "filledBy",
});

User.hasMany(LaserMedicalAssessment, {
  foreignKey: "filledByUserId",
  as: "filledLaserAssessments",
});
LaserMedicalAssessment.belongsTo(User, {
  foreignKey: "filledByUserId",
  as: "filledBy",
});

User.hasMany(AssessmentPhoto, {
  foreignKey: "uploadedByUserId",
  as: "uploadedPhotos",
});
AssessmentPhoto.belongsTo(User, {
  foreignKey: "uploadedByUserId",
  as: "uploadedBy",
});
User.hasMany(MedicalAssessment, {
  foreignKey: "performedByUserId",
  as: "performedMedicalAssessments",
});
MedicalAssessment.belongsTo(User, {
  foreignKey: "performedByUserId",
  as: "performedBy",
});

User.hasMany(LaserMedicalAssessment, {
  foreignKey: "performedByUserId",
  as: "performedLaserAssessments",
});
LaserMedicalAssessment.belongsTo(User, {
  foreignKey: "performedByUserId",
  as: "performedBy",
});

export default User;
