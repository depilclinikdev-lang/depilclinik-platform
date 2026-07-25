import React, { useState, useEffect } from "react";
import { LuX, LuPlus, LuTrash2 } from "react-icons/lu";
import api from "../services/api";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const BRAND_COLORS = {
  "Modelha DK": "#197e88",
  Depilclinik: "#c026d3",
};

const initialFormState = {
  brand: "Modelha DK",
  name: "",
  description: "",
  suggestedFrequency: "",
  regularPrice: "",
  promoPrice: "",
  requiresAssessment: false,
};

const ServiceModal = ({ isOpen, onClose, onRefresh, service }) => {
  const isEditMode = Boolean(service);

  const [formData, setFormData] = useState(initialFormState);
  const [inclusions, setInclusions] = useState([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentBrandColor = BRAND_COLORS[formData.brand] || "#197e88";

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (isEditMode) {
        setFormData({
          brand: service.brand || "Modelha DK",
          name: service.name || "",
          description: service.description || "",
          suggestedFrequency: service.suggestedFrequency || "",
          regularPrice: service.regularPrice || "",
          promoPrice: service.promoPrice || "",
          requiresAssessment: Boolean(service.requiresAssessment),
        });
        const existingItems = (service.inclusions || []).map(
          (inc) => inc.itemName,
        );
        setInclusions(existingItems.length > 0 ? existingItems : [""]);
      } else {
        setFormData(initialFormState);
        setInclusions([""]);
      }
    }
  }, [isOpen, service]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleInclusionChange = (index, value) => {
    setInclusions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddInclusion = () => {
    setInclusions((prev) => [...prev, ""]);
  };

  const handleRemoveInclusion = (index) => {
    setInclusions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    showLoading(isEditMode ? "Guardando servicio..." : "Creando servicio...");

    const payload = {
      ...formData,
      regularPrice: Number(formData.regularPrice),
      promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
      inclusions: inclusions.map((item) => item.trim()).filter(Boolean),
    };

    try {
      if (isEditMode) {
        await api.put(`/services/${service.serviceId}`, payload);
      } else {
        await api.post("/services", payload);
      }
      closeAlert();
      showSuccess(isEditMode ? "Servicio actualizado" : "Servicio creado");
      onRefresh();
      onClose();
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message ||
        `Error al ${isEditMode ? "actualizar" : "registrar"} el servicio`;
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70 shrink-0">
          <h2 className="text-lg font-bold text-primary">
            {isEditMode ? "Editar Servicio" : "Nuevo Servicio"}
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary transition-colors text-sm font-bold cursor-pointer"
          >
            <LuX size={22} />
          </button>
        </div>

        <form
          id="serviceForm"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 flex-1"
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Marca *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Modelha DK", "Depilclinik"].map((brand) => {
                const isSelected = formData.brand === brand;
                const brandColor = BRAND_COLORS[brand];
                return (
                  <button
                    type="button"
                    key={brand}
                    onClick={() => setFormData((prev) => ({ ...prev, brand }))}
                    className="px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer text-center outline-none ring-0 focus:outline-none"
                    style={
                      isSelected
                        ? {
                            backgroundColor: brandColor,
                            borderColor: brandColor,
                            color: "#fff",
                          }
                        : {
                            borderColor: "#e5e7eb",
                            color: "#1e293b",
                            backgroundColor: "#fff",
                          }
                    }
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Nombre del Servicio *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Depilación Láser Full Body"
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white transition-colors"
              onFocus={(e) => (e.target.style.borderColor = currentBrandColor)}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white resize-none transition-colors"
              onFocus={(e) => (e.target.style.borderColor = currentBrandColor)}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Precio Regular *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="regularPrice"
                required
                value={formData.regularPrice}
                onChange={handleChange}
                placeholder="Ej. 1500"
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white transition-colors"
                onFocus={(e) =>
                  (e.target.style.borderColor = currentBrandColor)
                }
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Precio Promocional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="promoPrice"
                value={formData.promoPrice}
                onChange={handleChange}
                placeholder="Ej. 1200"
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white transition-colors"
                onFocus={(e) =>
                  (e.target.style.borderColor = currentBrandColor)
                }
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Frecuencia Sugerida
            </label>
            <input
              type="text"
              name="suggestedFrequency"
              value={formData.suggestedFrequency}
              onChange={handleChange}
              placeholder="Ej. Cada 21 días"
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white transition-colors"
              onFocus={(e) => (e.target.style.borderColor = currentBrandColor)}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              name="requiresAssessment"
              checked={formData.requiresAssessment}
              onChange={handleChange}
              className="h-4 w-4 rounded border-borderClinik"
              style={{ accentColor: currentBrandColor }}
            />
            Requiere valoración médica previa
          </label>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-primary uppercase">
                El Servicio Incluye
              </label>
              <button
                type="button"
                onClick={handleAddInclusion}
                className="flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer transition-colors"
                style={{ color: currentBrandColor }}
              >
                <LuPlus size={14} /> Agregar ítem
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {inclusions.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      handleInclusionChange(index, e.target.value)
                    }
                    placeholder="Ej. 6 sesiones de láser"
                    className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm focus:outline-none bg-white transition-colors"
                    onFocus={(e) =>
                      (e.target.style.borderColor = currentBrandColor)
                    }
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                  {inclusions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(index)}
                      className="p-2 text-accent hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 flex justify-end gap-2 bg-gray-50/70 p-4 shrink-0 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-borderClinik rounded-full text-xs font-semibold text-primary hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="serviceForm"
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading
              ? "Guardando..."
              : isEditMode
                ? "Guardar Cambios"
                : "Crear Servicio"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
