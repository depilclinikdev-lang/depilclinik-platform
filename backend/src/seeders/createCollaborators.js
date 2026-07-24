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
    console.log("Conexión establecida para la creación de colaboradoras.");

    const collaboratorsData = [
      {
        name: "Laura Gómez Patricia",
        phone: "6181112233",
        email: "laura.gomez@skinclinic.com",
        password: "Temporal123",
        gender: "M",
        birth: "1994-05-15",
        address: "Calle Hidalgo #102, Col. Centro, Durango",
        jobPosition: "Terapeuta",
        emergencyContactName: "Roberto Gómez (Padre)",
        emergencyContactPhone: "6189991122",
        medicalInsuranceNumber: "12345678901",
        role: "Colaborador",
        isActive: true,
        mustChangePassword: true,
      },
      {
        name: "Mariana Ríos Castro",
        phone: "6182223344",
        email: "mariana.rios@skinclinic.com",
        password: "Temporal123",
        gender: "M",
        birth: "1997-09-20",
        address: "Av. 20 de Noviembre #504, Col. Silvestre Dorador, Durango",
        jobPosition: "Terapeuta",
        emergencyContactName: "Carmen Castro (Mamá)",
        emergencyContactPhone: "6188882233",
        medicalInsuranceNumber: "23456789012",
        role: "Colaborador",
        isActive: true,
        mustChangePassword: true,
      },
      {
        name: "Sofia Valeria Mendoza",
        phone: "6183334455",
        email: "sofia.mendoza@skinclinic.com",
        password: "Temporal123",
        gender: "M",
        birth: "1999-01-10",
        address: "Calle Pino Suárez #310, Col. Nueva Vizcaya, Durango",
        jobPosition: "Recepcionista",
        emergencyContactName: "Carlos Mendoza (Esposo)",
        emergencyContactPhone: "6187773344",
        medicalInsuranceNumber: "34567890123",
        role: "Colaborador",
        isActive: true,
        mustChangePassword: true,
      },
      {
        name: "Andrea Torres Beltrán",
        phone: "6184445566",
        email: "andrea.torres@skinclinic.com",
        password: "Temporal123",
        gender: "M",
        birth: "1995-11-30",
        address: "Fracc. Los Remedios, Calle Laurel #120, Durango",
        jobPosition: "Terapeuta",
        emergencyContactName: "Patricia Beltrán (Mamá)",
        emergencyContactPhone: "6186664455",
        medicalInsuranceNumber: "45678901234",
        role: "Colaborador",
        isActive: true,
        mustChangePassword: true,
      },
      {
        name: "Karla Paola Fernández",
        phone: "6185556677",
        email: "karla.fernandez@skinclinic.com",
        password: "Temporal123",
        gender: "M",
        birth: "1998-03-18",
        address: "Calle Constitución #405, Zona Centro, Durango",
        jobPosition: "Terapeuta",
        emergencyContactName: "Jorge Fernández (Hermano)",
        emergencyContactPhone: "6185555566",
        medicalInsuranceNumber: "56789012345",
        role: "Colaborador",
        isActive: true,
        mustChangePassword: true,
      },
    ];

    for (const data of collaboratorsData) {
      const existingUser = await User.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        // Actualizamos los datos para llenar los campos vacíos en los registros ya creados
        await existingUser.update(data);
        console.log(`✔ Datos actualizados/completados para: ${data.name}`);
        continue;
      }

      await User.create(data);
      console.log(`✔ Colaboradora creada completa: ${data.name}`);
    }

    console.log("\n--- Proceso finalizado con éxito ---");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear/actualizar las colaboradoras:", error);
    process.exit(1);
  }
};

run();
