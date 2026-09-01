import { useEffect, useState, useCallback } from "react";
import { LuArrowLeft, LuFileText, LuTrophy } from "react-icons/lu";
import api from "../services/api";
import AssessmentSummaryView from "../components/clinicalRecord/AssessmentSummaryView";
import ModelhaAssessmentForm from "../components/clinicalRecord/ModelhaAssessmentForm";
import LaserAssessmentForm from "../components/clinicalRecord/LaserAssessmentForm";
import PackageComparisonView from "../components/clinicalRecord/PackageComparisonView";
import HistoricalEntrySetupModal from "../components/HistoricalEntrySetupModal";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const BRAND_COLORS = { "Modelha DK": "#197e88", Depilclinik: "#c026d3" };

const CustomerServicesPage = ({ customer, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [viewingComparison, setViewingComparison] = useState(null);
  const [saving, setSaving] = useState(false);
  const [servicePackages, setServicePackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [isHistoricalSetupOpen, setIsHistoricalSetupOpen] = useState(false);
  const [historicalSetupData, setHistoricalSetupData] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const [medicalRes, laserRes] = await Promise.all([
        api.get(`/assessments/customer/${customer.customerId}/services`),
        api.get(`/laser-assessments/customer/${customer.customerId}/services`),
      ]);
      const combined = [...medicalRes.data, ...laserRes.data].sort(
        (a, b) => new Date(b.serviceDate) - new Date(a.serviceDate),
      );
      setServices(combined);
      setError("");
    } catch (err) {
      setError("No se pudo cargar los servicios de este cliente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [customer.customerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchAssessmentDetail = async (item) => {
    setAssessmentLoading(true);
    try {
      const endpoint =
        item.type === "medical"
          ? `/assessments/customer/${customer.customerId}/service/${item.serviceId}`
          : `/laser-assessments/customer/${customer.customerId}/service/${item.serviceId}`;
      const response = await api.get(endpoint);
      setAssessment(response.data);
    } catch (err) {
      showError("Error", "No se pudo cargar el expediente de este servicio");
      console.error(err);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const fetchServicePackages = async (item) => {
    setPackagesLoading(true);
    try {
      const response = await api.get(
        `/packages/customer/${customer.customerId}/service/${item.serviceId}`,
      );
      const list = response.data || [];
      setServicePackages(list);
      setSelectedPackageId(list.length > 0 ? list[0].packageId : null);
    } catch (err) {
      console.error(err);
      setServicePackages([]);
      setSelectedPackageId(null);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleSelectService = (item) => {
    setSelected(item);
    fetchAssessmentDetail(item);
    fetchServicePackages(item);
  };

  const handleUpdateAssessment = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando cambios...");
    try {
      const endpoint =
        selected.type === "medical"
          ? `/assessments/${editingAssessment.assessmentId}`
          : `/laser-assessments/${editingAssessment.laserAssessmentId}`;

      await api.put(endpoint, formPayload);

      closeAlert();
      showSuccess("Expediente actualizado");
      setEditingAssessment(null);
      fetchAssessmentDetail(selected);
      fetchServices();
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo actualizar el expediente",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmHistoricalSetup = (data) => {
    setHistoricalSetupData(data);
    setIsHistoricalSetupOpen(false);
  };

  const handleSaveHistorical = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando registro histórico...");
    try {
      const endpoint =
        historicalSetupData.brand === "Modelha DK"
          ? "/assessments/historical-entry"
          : "/laser-assessments/historical-entry";

      await api.post(endpoint, {
        ...formPayload,
        customerId: customer.customerId,
        serviceId: historicalSetupData.serviceId,
        serviceDate: historicalSetupData.assessmentDate,
      });

      closeAlert();
      showSuccess("Registro histórico guardado");
      setHistoricalSetupData(null);
      fetchServices();
    } catch (err) {
      closeAlert();
      showError(
        "Error",
        err.response?.data?.message || "No se pudo guardar el registro",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Fecha no registrada";
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "Fecha no registrada";
    return parsed.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  if (viewingComparison) {
    const completedPackages = servicePackages.filter(
      (p) => p.status === "Completado",
    );
    return (
      <PackageComparisonView
        packageId={viewingComparison.packageId}
        type={viewingComparison.type}
        customerName={customer.name}
        onBack={() => setViewingComparison(null)}
        availablePackages={completedPackages}
        onSelectPackage={(newPackageId) =>
          setViewingComparison({
            packageId: newPackageId,
            type: viewingComparison.type,
          })
        }
      />
    );
  }

  if (editingAssessment) {
    return (
      <div className="fixed inset-0 z-50 bg-[#eef2f5] flex flex-col overflow-hidden">
        <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-20">
          <button
            onClick={() => setEditingAssessment(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-borderClinik bg-white text-sm font-bold text-primary hover:bg-gray-50 hover:border-secondary transition-colors cursor-pointer shadow-sm"
          >
            <LuArrowLeft size={18} />
            Regresar
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <span className="text-lg font-black tracking-wide text-primary">
            Editar Expediente
            <span className="ml-2 text-sm font-semibold text-accent">
              · {selected?.brand}
            </span>
          </span>
        </header>

        <main className="flex-1 p-6 max-w-5xl w-full mx-auto overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mt-6 mb-6">
            {selected?.type === "medical" ? (
              <ModelhaAssessmentForm
                onSubmit={handleUpdateAssessment}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                initialData={editingAssessment}
                isEditMode
                isManualEdit
                packagesForNotes={servicePackages}
              />
            ) : (
              <LaserAssessmentForm
                onSubmit={handleUpdateAssessment}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                initialData={editingAssessment}
                isEditMode
                isManualEdit
                packagesForNotes={servicePackages}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  if (historicalSetupData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#eef2f5] flex flex-col overflow-hidden">
        <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-20">
          <button
            onClick={() => setHistoricalSetupData(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-borderClinik bg-white text-sm font-bold text-primary hover:bg-gray-50 hover:border-secondary transition-colors cursor-pointer shadow-sm"
          >
            <LuArrowLeft size={18} />
            Regresar
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <span className="text-lg font-black tracking-wide text-primary">
            Registro Histórico
            <span className="ml-2 text-sm font-semibold text-accent">
              · {historicalSetupData.brand}
            </span>
          </span>
        </header>

        <main className="flex-1 p-6 max-w-5xl w-full mx-auto overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mt-6 mb-6">
            {historicalSetupData.brand === "Modelha DK" ? (
              <ModelhaAssessmentForm
                onSubmit={handleSaveHistorical}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                isEditMode
                isManualEdit
                hideDateField
                allowSessionNote
              />
            ) : (
              <LaserAssessmentForm
                onSubmit={handleSaveHistorical}
                saving={saving}
                customerName={customer.name}
                pendingPhotos={{}}
                onPhotoSelect={() => {}}
                isEditMode
                isManualEdit
                hideDateField
                allowSessionNote
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-accent hover:text-primary transition-colors cursor-pointer"
        >
          <LuArrowLeft size={18} />
          Regresar
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <div>
          <h2 className="text-xl font-bold text-primary">
            Servicios del Cliente
          </h2>
          <p className="text-xs text-accent">{customer.name}</p>
        </div>
        <button
          onClick={() => setIsHistoricalSetupOpen(true)}
          className="ml-auto px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          + Registrar Servicio Anterior
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-secondary text-center font-medium text-sm">
            Cargando servicios...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-red-600 text-center font-medium text-sm">
            {error}
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-accent text-center font-medium text-sm">
            Este cliente aún no tiene expedientes registrados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="p-4 border-b border-gray-100 bg-gray-50/70">
              <span className="text-xs font-bold text-primary uppercase">
                Servicios
              </span>
            </div>
            <div className="flex flex-col divide-y divide-gray-50 max-h-125 overflow-y-auto">
              {services.map((item) => {
                const key =
                  item.type === "medical"
                    ? `medical-${item.assessmentId}`
                    : `laser-${item.laserAssessmentId}`;
                const isSelected =
                  selected &&
                  ((selected.type === "medical" &&
                    item.type === "medical" &&
                    selected.assessmentId === item.assessmentId) ||
                    (selected.type === "laser" &&
                      item.type === "laser" &&
                      selected.laserAssessmentId === item.laserAssessmentId));
                const isCompleted = item.packageStatus?.status === "Completado";

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectService(item)}
                    className={`text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-secondary/5 border-l-4 border-secondary"
                        : "border-l-4 border-transparent hover:bg-gray-50/70"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: BRAND_COLORS[item.brand] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-secondary" : "text-primary"
                        }`}
                      >
                        {item.serviceName}
                      </p>
                      <p className="text-[10px] text-accent truncate">
                        {item.brand}
                      </p>
                      {item.packageStatus && (
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          Paquete {item.packageStatus.sessionsCompleted}/
                          {item.packageStatus.totalSessions}
                          {isCompleted ? " · Completado" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {!selected ? (
              <p className="text-sm text-accent text-center py-8">
                Selecciona un servicio para ver su expediente.
              </p>
            ) : assessmentLoading ? (
              <p className="text-sm text-secondary text-center py-8">
                Cargando expediente...
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <LuFileText size={18} className="text-depil" />
                      <p className="text-sm font-bold text-primary">
                        {selected.serviceName}
                      </p>
                    </div>
                    <p className="text-[11px] text-accent mt-0.5 ml-6">
                      Última actualización:{" "}
                      {formatDate(assessment?.serviceDate)}
                    </p>
                  </div>
                </div>

                {servicePackages.length > 0 && (
                  <div className="mb-5 pb-5 border-b border-gray-100">
                    <p className="text-xs font-bold text-primary uppercase mb-2">
                      Paquetes de este servicio
                    </p>
                    {(() => {
                      const selectedPkg = servicePackages.find(
                        (p) => p.packageId === selectedPackageId,
                      );
                      const selectedIsCompleted =
                        selectedPkg?.status === "Completado";
                      return (
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={String(selectedPackageId ?? "")}
                            onChange={(e) =>
                              setSelectedPackageId(Number(e.target.value))
                            }
                            className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50/70 cursor-pointer"
                          >
                            {servicePackages.map((pkg, index) => (
                              <option
                                key={pkg.packageId}
                                value={String(pkg.packageId)}
                              >
                                Paquete #{servicePackages.length - index} (
                                {pkg.sessionsCompleted}/{pkg.totalSessions} ·{" "}
                                {pkg.status})
                              </option>
                            ))}
                          </select>

                          {selectedIsCompleted ? (
                            <button
                              onClick={() =>
                                setViewingComparison({
                                  packageId: selectedPkg.packageId,
                                  type: selected.type,
                                })
                              }
                              className="flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-full text-xs font-bold bg-linear-to-r from-secondary to-depil text-white hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              <LuTrophy size={14} /> Ver Resultado
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-full shrink-0">
                              En progreso
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <AssessmentSummaryView
                  assessment={assessment}
                  onEdit={setEditingAssessment}
                />
              </>
            )}
          </div>
        </div>
      )}

      <HistoricalEntrySetupModal
        isOpen={isHistoricalSetupOpen}
        onClose={() => setIsHistoricalSetupOpen(false)}
        onConfirm={handleConfirmHistoricalSetup}
      />
    </div>
  );
};

export default CustomerServicesPage;
