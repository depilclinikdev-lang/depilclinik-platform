import React, { useState, useEffect } from "react";
import api from "../services/api";

const getTodayISO = () => new Date().toISOString().slice(0, 10);

const HistoricalAssessmentSetupModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialBrand = "Modelha DK",
}) => {
  const [brand, setBrand] = useState(initialBrand);
  const [assessmentDate, setAssessmentDate] = useState(getTodayISO());
  const [serviceId, setServiceId] = useState("");
  const [performedByUserId, setPerformedByUserId] = useState("");
  const [services, setServices] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setBrand(initialBrand);
    setAssessmentDate(getTodayISO());
    setServiceId("");
    setPerformedByUserId("");
    setError("");

    api
      .get("/auth/usuarios")
      .then((res) => setCollaborators(res.data.filter((u) => u.is_active)))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setServiceId("");
    api
      .get(`/services?brand=${encodeURIComponent(brand)}`)
      .then((res) => setServices(res.data.filter((s) => s.isActive)))
      .catch(console.error);
  }, [isOpen, brand]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (!assessmentDate) {
      setError("Selecciona la fecha en que se realizó la revisión");
      return;
    }
    if (new Date(assessmentDate) > new Date()) {
      setError("La fecha no puede ser posterior al día de hoy");
      return;
    }
    if (!serviceId) {
      setError("Selecciona el servicio realizado");
      return;
    }

    onConfirm({
      brand,
      assessmentDate,
      serviceId: Number(serviceId),
      performedByUserId: performedByUserId ? Number(performedByUserId) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-left">
        <h2 className="text-lg font-bold text-primary mb-1">
          Registrar Expediente Histórico
        </h2>
        <p className="text-xs text-accent mb-5">
          Captura los datos de una revisión que ya se realizó, sin necesidad de
          tener una cita agendada en el sistema.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 mb-4">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-primary uppercase mb-1">
              Marca *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Modelha DK", "Depilclinik"].map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    brand === b
                      ? "bg-secondary text-white border-secondary"
                      : "border-borderClinik text-primary hover:bg-gray-50"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Fecha de la revisión *
            </label>
            <input
              type="date"
              value={assessmentDate}
              max={getTodayISO()}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Servicio realizado *
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
            >
              <option value="">Selecciona un servicio de {brand}</option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-primary">
              Colaborador que atendió
            </label>
            <select
              value={performedByUserId}
              onChange={(e) => setPerformedByUserId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-borderClinik text-sm bg-white focus:outline-none focus:border-secondary"
            >
              <option value="">Sin especificar</option>
              {collaborators.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-borderClinik rounded-full text-xs font-semibold text-primary hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md"
          >
            Continuar al Formulario
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAssessmentSetupModal;
