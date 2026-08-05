import Customer from "../models/Customer.js";
import { Op } from "sequelize";
import { sanitizeEmptyStrings } from "../utils/sanitize.js";

export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      birthdate,
      gender,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      medicalInsuranceNumber,
    } = sanitizeEmptyStrings(req.body);

    const phoneExists = await Customer.findOne({
      where: {
        phone,
        isActive: true,
      },
    });

    if (phoneExists) {
      return res
        .status(400)
        .json({ message: "A customer with this phone number already exists" });
    }

    if (email) {
      const emailExists = await Customer.findOne({
        where: {
          email,
          isActive: true,
        },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "A customer with this email already exists" });
      }
    }

    if (medicalInsuranceNumber) {
      const insuranceExists = await Customer.findOne({
        where: {
          medicalInsuranceNumber,
          isActive: true,
        },
      });
      if (insuranceExists) {
        return res.status(400).json({
          message:
            "Ya existe un cliente registrado con ese número de seguro médico",
        });
      }
    }

    const newCustomer = await Customer.create({
      name,
      phone,
      email,
      birthdate,
      gender,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      medicalInsuranceNumber,
    });

    const customerData = newCustomer.toJSON();

    res.status(201).json({
      ...customerData,
      createdAt:
        customerData.createdAt || customerData.created_at || new Date(),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const conflictField = error.errors?.[0]?.path;
      const fieldLabels = {
        phone: "teléfono",
        email: "correo electrónico",
        medical_insurance_number: "número de seguro médico",
      };
      const label = fieldLabels[conflictField] || "dato ingresado";
      return res.status(400).json({
        message: `Ya existe un cliente registrado con ese ${label}`,
      });
    }
    res.status(500).json({
      message: "Server error while creating customer",
      error: error.message,
    });
  }
};

export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }

    const customers = await Customer.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } },
        ],
      },
      attributes: ["customerId", "name", "phone", "email"],
      order: [["name", "ASC"]],
      limit: 10,
    });

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Server error while searching customers",
      error: error.message,
    });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [["customer_id", "DESC"]],
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching customers",
      error: error.message,
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching customer",
      error: error.message,
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const sanitizedBody = sanitizeEmptyStrings(req.body);
    await customer.update(sanitizedBody);

    res.status(200).json(customer);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const conflictField = error.errors?.[0]?.path;
      const fieldLabels = {
        phone: "teléfono",
        email: "correo electrónico",
        medical_insurance_number: "número de seguro médico",
      };
      const label = fieldLabels[conflictField] || "dato ingresado";
      return res.status(400).json({
        message: `Ya existe un cliente registrado con ese ${label}`,
      });
    }
    res.status(500).json({
      message: "Server error while updating customer",
      error: error.message,
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.update({ isActive: false });

    res.status(200).json({
      message: "Customer deactivated successfully (Logical Deletion)",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deactivating customer",
      error: error.message,
    });
  }
};

export const reactivateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (customer.isActive) {
      return res.status(400).json({ message: "Customer is already active" });
    }

    await customer.update({ isActive: true });

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Server error while reactivating customer",
      error: error.message,
    });
  }
};
