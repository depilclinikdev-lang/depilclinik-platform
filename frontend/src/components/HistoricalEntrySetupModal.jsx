import { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";
import api from "../services/api";
import { useBackButtonClose } from "../hooks/useBackButtonClose";

const BRANDS = ["Modelha DK", "Depilclinik"];

const HistoricalEntrySetupModal = ({ isOpen, onClose, onConfirm }) => {
  const [brand, setBrand] = useState("Modelha DK");
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  useBackButtonClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setBrand("Modelha DK");
    setServiceId("");
    setDate("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setServiceId("");
    api
      .get("/services", { params: { brand } })
      .then((res) => setServices(res.data || []))
      .catch(() => setServices([]));
  }, [brand, isOpen]);

  if (!isOpen) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maxDate = yesterday.toISOString().slice(0, 10);

  const handleConfirm = () => {
    if (!serviceId || !date) return;
    onConfirm({ brand, serviceId: Number(serviceId), assessmentDate: date });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-left">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-bold text-primary">
            Registrar Servicio Anterior
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary cursor-pointer"
          >
            <LuX size={20} />
          </button>
        </div>
        <p className="text-xs text-accent mb-5">
          Captura los datos de una revisión que ya se realizó, con una fecha
          anterior a hoy.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-primary mb-1.5 block">
              Marca *
            </label>
            <div className="flex gap-2">
              {BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                    brand === b
                      ? "bg-secondary text-white"
                      : "border border-borderClinik text-primary hover:bg-gray-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-primary mb-1.5 block">
              Fecha de la revisión *
            </label>
            <input
              type="date"
              value={date}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-primary mb-1.5 block">
              Servicio realizado *
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
            >
              <option value="">Selecciona...</option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full border border-borderClinik text-sm font-semibold text-primary hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!serviceId || !date || loading}
            className="px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            Continuar al Formulario
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricalEntrySetupModal;
