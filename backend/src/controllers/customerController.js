import Customer from "../models/Customer.js";
import { Op } from "sequelize";

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
    } = req.body;

    const phoneExists = await Customer.findOne({
      where: {
        phone,
        isActive: true, // <-- FILTRAR SOLO ACTIVOS
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
          isActive: true, // <-- FILTRAR SOLO ACTIVOS
        },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "A customer with this email already exists" });
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
      return res.status(400).json({
        message:
          "Ya existe un cliente registrado con ese teléfono o correo electrónico",
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

    await customer.update(req.body);

    res.status(200).json(customer);
  } catch (error) {
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
