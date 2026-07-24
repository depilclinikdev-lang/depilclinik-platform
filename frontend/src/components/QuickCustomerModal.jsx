import React, { useState } from "react";
import api from "../services/api";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const initialFormState = {
  name: "",
  phone: "",
  birthdate: "",
  gender: "M",
};

const QuickCustomerModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    showLoading("Registrando cliente...");

    try {
      const response = await api.post("/customers/create", formData);
      closeAlert();
      showSuccess("Cliente registrado");
      onCreated(response.data);
      setFormData(initialFormState);
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message || "Error al registrar el cliente";
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-left">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-bold text-primary">Registro Rápido</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-accent mb-4">
          Solo lo esencial para agendar. Podrás completar el expediente completo
          después desde Clientes.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">Teléfono *</label>
            <input
              type="tel"
              name="phone"
              maxLength="10"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-primary">
                Nacimiento *
              </label>
              <input
                type="date"
                name="birthdate"
                required
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-primary">Género *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-borderClinik bg-white focus:outline-none focus:border-secondary"
              >
                <option value="M">Mujer</option>
                <option value="H">Hombre</option>
                <option value="ND">No Definido</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Registrar y Seleccionar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickCustomerModal;
