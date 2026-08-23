import Service from "../models/Service.js";
import ServiceInclusion from "../models/ServiceInclusion.js";
import { invalidateCache } from "../middlewares/cache.js";

const inclusionInclude = {
  model: ServiceInclusion,
  as: "inclusions",
  attributes: ["inclusionId", "itemName"],
};

export const getAllServices = async (req, res) => {
  try {
    const { brand } = req.query;
    const where = { isHidden: false };
    if (brand) where.brand = brand;

    const services = await Service.findAll({
      where,
      include: [inclusionInclude],
      order: [
        ["brand", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching services",
      error: error.message,
    });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id, {
      include: [inclusionInclude],
    });

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching service",
      error: error.message,
    });
  }
};

export const createService = async (req, res) => {
  const t = await Service.sequelize.transaction();

  try {
    const {
      brand,
      name,
      description,
      suggestedFrequency,
      regularPrice,
      promoPrice,
      requiresAssessment,
      inclusions,
    } = req.body;

    if (!brand || !name || !regularPrice) {
      await t.rollback();
      return res.status(400).json({
        message: "Marca, nombre y precio regular son campos requeridos",
      });
    }

    const newService = await Service.create(
      {
        brand,
        name,
        description: description || null,
        suggestedFrequency: suggestedFrequency || null,
        regularPrice,
        promoPrice: promoPrice || null,
        requiresAssessment: Boolean(requiresAssessment),
      },
      { transaction: t },
    );

    const cleanInclusions = (inclusions || [])
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);

    if (cleanInclusions.length > 0) {
      await ServiceInclusion.bulkCreate(
        cleanInclusions.map((itemName) => ({
          serviceId: newService.serviceId,
          itemName,
        })),
        { transaction: t },
      );
    }

    await t.commit();
    await invalidateCache("services");

    const fullService = await Service.findByPk(newService.serviceId, {
      include: [inclusionInclude],
    });

    res.status(201).json(fullService);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while creating service",
      error: error.message,
    });
  }
};

export const updateService = async (req, res) => {
  const t = await Service.sequelize.transaction();

  try {
    const { id } = req.params;
    const service = await Service.findByPk(id, { transaction: t });

    if (!service) {
      await t.rollback();
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const { inclusions, ...serviceFields } = req.body;

    await service.update(serviceFields, { transaction: t });

    if (Array.isArray(inclusions)) {
      const cleanInclusions = inclusions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);

      await ServiceInclusion.destroy({
        where: { serviceId: id },
        transaction: t,
      });

      if (cleanInclusions.length > 0) {
        await ServiceInclusion.bulkCreate(
          cleanInclusions.map((itemName) => ({
            serviceId: id,
            itemName,
          })),
          { transaction: t },
        );
      }
    }

    await t.commit();
    await invalidateCache("services");

    const fullService = await Service.findByPk(id, {
      include: [inclusionInclude],
    });

    res.status(200).json(fullService);
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: "Server error while updating service",
      error: error.message,
    });
  }
};

export const deactivateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    await service.update({ isActive: false });
    await invalidateCache("services");

    res.status(200).json({ message: "Servicio desactivado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deactivating service",
      error: error.message,
    });
  }
};

export const reactivateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    await service.update({ isActive: true });
    await invalidateCache("services");

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({
      message: "Server error while reactivating service",
      error: error.message,
    });
  }
};
export const hideService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    await service.update({ isHidden: true });
    await invalidateCache("services");

    res.status(200).json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Server error while hiding service",
      error: error.message,
    });
  }
};
