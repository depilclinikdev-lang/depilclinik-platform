import React, { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";
import api from "../services/api";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const EditPackageModal = ({ isOpen, pkg, onClose, onRefresh }) => {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useBackButtonClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !pkg) return;
    setServiceId(pkg.serviceId || pkg.service?.serviceId || "");
    setTotalSessions(pkg.totalSessions || "");
    setTotalPrice(pkg.totalPrice || "");
    setNotes(pkg.notes || "");

    api
      .get(`/services?brand=${encodeURIComponent(pkg.marca)}`)
      .then((res) => setServices(res.data.filter((s) => s.isActive)))
      .catch(console.error);
  }, [isOpen, pkg]);

  if (!isOpen || !pkg) return null;

  const handleSave = async () => {
    if (!serviceId || !totalSessions || !totalPrice) {
      showError("Faltan datos", "Servicio, sesiones y precio son obligatorios");
      return;
    }

    setSaving(true);
    showLoading("Guardando cambios...");
    try {
      await api.put(`/packages/${pkg.packageId}`, {
        serviceId: Number(serviceId),
        totalSessions: Number(totalSessions),
        totalPrice: Number(totalPrice),
        notes,
      });
      closeAlert();
      showSuccess("Paquete actualizado");
      onClose();
      onRefresh();
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo actualizar el paquete",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div>
            <h2 className="text-lg font-bold text-primary">Editar Paquete</h2>
            <p className="text-xs text-accent">{pkg.customer?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary cursor-pointer"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">Servicio *</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
            >
              <option value="">Selecciona un servicio de {pkg.marca}</option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Total de sesiones *
            </label>
            <input
              type="number"
              min="1"
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
            />
            <p className="text-[11px] text-accent">
              Ya completadas: {pkg.sessionsCompleted}. No se puede bajar de ese
              número.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Precio total *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
            />
            <p className="text-[11px] text-accent">
              Ya pagado: ${parseFloat(pkg.amountPaid).toFixed(2)}. No se puede
              bajar de ese monto.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-borderClinik rounded-full text-xs font-semibold text-primary hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPackageModal;
