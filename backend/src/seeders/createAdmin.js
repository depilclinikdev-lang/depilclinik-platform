import sequelize from "../config/db.js";
import User from "../models/User.js";

if (process.env.NODE_ENV === "production") {
  console.error(
    "Los seeders no pueden ejecutarse en producción (NODE_ENV=production).",
  );
  process.exit(1);
}

const run = async () => {
  try {
    await sequelize.authenticate();

    const existingAdmin = await User.findOne({
      where: { email: "brian@skinclinic.com" },
    });
    if (existingAdmin) {
      console.log("Ya existe un usuario con ese correo, no se crea de nuevo.");
      process.exit(0);
    }

    await User.create({
      name: "Brian Gonzalez Ramirez",
      phone: "6181234567",
      email: "brian@skinclinic.com",
      password: "Temporal123",
      gender: "H",
      role: "Administrador",
      isActive: true,
      mustChangePassword: true,
    });

    console.log("Administrador inicial creado con éxito.");
    console.log("Correo: brian@skinclinic.com");
    console.log("Contraseña temporal: Temporal123");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear el administrador inicial:", error);
    process.exit(1);
  }
};

run();
