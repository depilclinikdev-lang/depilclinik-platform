import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth.js";

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      role,
      birth,
      address,
      jobPosition,
      emergencyContactName,
      emergencyContactPhone,
      medicalInsuranceNumber,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const userExists = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const temporaryPassword = crypto.randomBytes(5).toString("hex");

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: temporaryPassword,
      phone,
      gender,
      role,
      birth,
      address,
      jobPosition,
      emergencyContactName,
      emergencyContactPhone,
      medicalInsuranceNumber,
      mustChangePassword: true,
    });

    res.status(201).json({
      message: "User registered successfully",
      temporaryPassword,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mustChangePassword: newUser.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || user.isActive === false) {
      return res
        .status(401)
        .json({ message: "Credenciales inválidas o cuenta inactiva" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, cookieOptions);

    const mustChangeVal = Boolean(
      user.must_change_password ?? user.mustChangePassword,
    );

    res.status(200).json({
      message: "Login exitoso",
      user: {
        id: user.public_id || user.publicId || user.id,
        name: user.name,
        role: user.rol || user.role,
        gender: user.gender,
        mustChangePassword: mustChangeVal,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      message: "Error del servidor durante el login",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: [
        ["user_id", "user_id"],
        "name",
        "email",
        ["rol", "rol"],
        ["is_active", "is_active"],
        ["job_position", "jobPosition"],
        ["must_change_password", "mustChangePassword"],
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al consultar usuarios en MySQL:", error);
    return res.status(500).json({
      message: "Error interno del servidor al obtener colaboradores",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.id;

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "La nueva contraseña es requerida" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({
      message: "Error interno del servidor al actualizar la contraseña",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const mustChangeVal = Boolean(
      user.must_change_password ?? user.mustChangePassword,
    );

    res.status(200).json({
      user: {
        id: user.public_id || user.publicId || user.id,
        name: user.name,
        email: user.email,
        role: user.rol || user.role,
        gender: user.gender,
        mustChangePassword: mustChangeVal,
      },
    });
  } catch (error) {
    console.error("Error en getMe:", error);
    res
      .status(500)
      .json({ message: "Error al verificar la sesión", error: error.message });
  }
};

export const logout = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  res.status(200).json({ message: "Sesión cerrada correctamente" });
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    const { password, id: userId, ...userData } = user.toJSON();

    res.status(200).json({ user_id: userId, ...userData });
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching employee",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    const { password, ...updatableFields } = req.body;
    await user.update(updatableFields);

    const { password: _pw, id: userId, ...userData } = user.toJSON();

    res.status(200).json({ user_id: userId, ...userData });
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating employee",
      error: error.message,
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    await user.update({ isActive: false });

    res.status(200).json({
      message: "Colaborador desactivado correctamente (Baja Lógica)",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deactivating employee",
      error: error.message,
    });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "Colaborador no encontrado" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "El colaborador ya está activo" });
    }

    await user.update({ isActive: true });

    res.status(200).json({ message: "Colaborador reactivado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Server error while reactivating employee",
      error: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Refresh token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "role", "isActive"],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account inactive or not found" });
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token renovado correctamente" });
  } catch (error) {
    return res.status(401).json({
      message: "Refresh token inválido o expirado",
      error: error.message,
    });
  }
};
