import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      charset: "utf8mb4",
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_0900_ai_ci",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      afterCreate: (conn, done) => {
        conn.query("SET NAMES utf8mb4", (err) => {
          done(err, conn);
        });
      },
    },
  },
);

export default sequelize;
