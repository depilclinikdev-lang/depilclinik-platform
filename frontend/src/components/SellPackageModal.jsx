import React, { useState, useEffect } from "react";
import api from "../services/api";
import CustomerAutocomplete from "./CustomerAutocomplete";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia"];

const initialState = {
  marca: "Modelha DK",
  serviceId: "",
  totalSessions: "",
  totalPrice: "",
  amountPaid: "",
  paymentMethod: "Efectivo",
  notes: "",
};

const SellPackageModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState(initialState);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useBackButtonClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState);
      setSelectedCustomer(null);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    api
      .get(`/services?brand=${encodeURIComponent(formData.marca)}`)
      .then((res) => setServices(res.data))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.marca, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Selecciona un cliente");
      return;
    }
    setLoading(true);
    setError("");
    showLoading("Registrando paquete...");
    try {
      await api.post("/packages", {
        customerId: selectedCustomer.customerId,
        serviceId: Number(formData.serviceId),
        marca: formData.marca,
        totalSessions: Number(formData.totalSessions),
        totalPrice: Number(formData.totalPrice),
        amountPaid: Number(formData.amountPaid) || 0,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || null,
      });
      closeAlert();
      showSuccess("Paquete registrado");
      onRefresh();
      onClose();
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message || "Error al registrar el paquete";
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <h2 className="text-lg font-bold text-primary">
            Vender Paquete de Sesiones
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
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
              {["Modelha DK", "Depilclinik"].map((brand) => (
                <button
                  type="button"
                  key={brand}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      marca: brand,
                      serviceId: "",
                    }))
                  }
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer ${
                    formData.marca === brand
                      ? "bg-secondary text-white border-secondary"
                      : "border-borderClinik text-primary hover:bg-gray-50"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Cliente *
            </label>
            <CustomerAutocomplete
              value={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Servicio *
            </label>
            <select
              name="serviceId"
              required
              value={formData.serviceId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm bg-white"
            >
              <option value="">
                Selecciona un servicio de {formData.marca}
              </option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Número de sesiones *
              </label>
              <input
                type="number"
                min="1"
                name="totalSessions"
                required
                value={formData.totalSessions}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Precio total *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="totalPrice"
                required
                value={formData.totalPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Monto pagado ahora
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amountPaid"
                value={formData.amountPaid}
                onChange={handleChange}
                placeholder="0 = queda con adeudo"
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary uppercase mb-1">
                Método de pago
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm bg-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              rows="2"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-borderClinik text-sm resize-none"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-2 bg-gray-50/70 -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-borderClinik rounded-full text-xs font-semibold text-primary hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar Paquete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellPackageModal;
