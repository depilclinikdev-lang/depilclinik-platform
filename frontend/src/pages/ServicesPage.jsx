import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LuPlus,
  LuPencil,
  LuCalendarClock,
  LuClipboardCheck,
  LuCheck,
  LuSearch,
} from "react-icons/lu";
import ServiceModal from "../components/ServiceModal";
import {
  showLoading,
  closeAlert,
  showError,
  showConfirm,
  showToast,
} from "../utils/alerts";

const BRAND_COLORS = {
  "Modelha DK": "#197e88",
  Depilclinik: "#c026d3",
};

const ServicesPage = ({ currentUserRole }) => {
  const isAdmin = currentUserRole === "Administrador";
  const [services, setServices] = useState([]);
  const [brandFilter, setBrandFilter] = useState("Modelha DK");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchServices = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get("/services");
      setServices(response.data);
      setError("");
    } catch (err) {
      setError("No se pudo conectar con el catálogo de servicios.");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (service) => {
    const willDeactivate = service.isActive;
    const confirmed = await showConfirm({
      title: willDeactivate ? "¿Desactivar servicio?" : "¿Reactivar servicio?",
      text: service.name,
    });
    if (!confirmed) return;

    setTogglingId(service.serviceId);
    showLoading("Actualizando estado...");
    try {
      if (willDeactivate) {
        await api.patch(`/services/${service.serviceId}/delete`);
      } else {
        await api.patch(`/services/${service.serviceId}/reactivate`);
      }
      await fetchServices({ silent: true });
      closeAlert();
      showToast(
        "success",
        willDeactivate ? "Servicio desactivado" : "Servicio reactivado",
      );
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo actualizar el estado del servicio");
    } finally {
      setTogglingId(null);
    }
  };
  const handleHideService = async (service) => {
    const confirmed = await showConfirm({
      title: "¿Eliminar este servicio?",
      text: `"${service.name}" dejará de verse en todo el sistema (catálogo, citas y paquetes). Esta acción no se puede deshacer desde aquí.`,
      icon: "warning",
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    setTogglingId(service.serviceId);
    showLoading("Eliminando servicio...");
    try {
      await api.patch(`/services/${service.serviceId}/hide`);
      await fetchServices({ silent: true });
      closeAlert();
      showToast("success", "Servicio eliminado del sistema");
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo eliminar el servicio");
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const filteredServices = services
    .filter((s) => s.brand === brandFilter)
    .filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {["Modelha DK", "Depilclinik"].map((brand) => {
              const isActive = brandFilter === brand;
              const color = BRAND_COLORS[brand];
              return (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className="px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm"
                  style={
                    isActive
                      ? {
                          backgroundColor: color,
                          borderColor: color,
                          color: "#fff",
                        }
                      : {
                          borderColor: "#e5e7eb",
                          color: "#6b7280",
                          backgroundColor: "#fff",
                        }
                  }
                >
                  {brand}
                </button>
              );
            })}
          </div>

          <span className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold whitespace-nowrap">
            {filteredServices.length} servicio
            {filteredServices.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
            style={{ backgroundColor: BRAND_COLORS[brandFilter] }}
          >
            <LuPlus size={14} /> Nuevo Servicio
          </button>
        )}
      </div>

      <div className="relative max-w-md w-full">
        <LuSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
        />
      </div>

      {loading ? (
        <p className="text-secondary text-center font-medium p-8 text-sm">
          Cargando catálogo...
        </p>
      ) : error ? (
        <p className="text-red-600 text-center font-medium p-8 text-sm">
          {error}
        </p>
      ) : filteredServices.length === 0 ? (
        <p className="text-accent text-center font-medium p-8 text-sm">
          No se encontraron servicios registrados para esta marca.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.serviceId}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative transition-opacity"
              style={{ opacity: service.isActive ? 1 : 0.55 }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ backgroundColor: BRAND_COLORS[service.brand] }}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  {service.brand}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <LuPencil size={17} />
                  </button>
                )}
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h3 className="text-base font-bold text-primary leading-snug">
                    {service.name}
                    {!service.isActive && (
                      <span className="text-xs font-semibold text-red-500 ml-2">
                        (Inactivo)
                      </span>
                    )}
                  </h3>
                  {service.description ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-10">
                      {service.description}
                    </p>
                  ) : (
                    <div className="min-h-10" />
                  )}
                </div>

                <div className="flex items-end gap-2">
                  {service.promoPrice ? (
                    <>
                      <span className="text-lg font-black text-secondary">
                        {formatPrice(service.promoPrice)}
                      </span>
                      <span className="text-xs text-gray-400 line-through mb-0.5">
                        {formatPrice(service.regularPrice)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-black text-primary">
                      {formatPrice(service.regularPrice)}
                    </span>
                  )}
                </div>

                {service.suggestedFrequency && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent bg-gray-50 border border-gray-200 px-3 py-1 rounded-full shrink-0">
                      <LuCalendarClock size={13} className="shrink-0" />
                      {service.suggestedFrequency}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  {service.inclusions?.length > 0 && (
                    <ul className="flex flex-col gap-1.5 my-1">
                      {service.inclusions.map((inc) => (
                        <li
                          key={inc.inclusionId}
                          className="flex items-start gap-2 text-xs text-primary"
                        >
                          <LuCheck
                            size={14}
                            className="text-emerald-600 shrink-0 mt-0.5"
                          />
                          <span>{inc.itemName}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {service.requiresAssessment && (
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                        <LuClipboardCheck size={13} className="shrink-0" />
                        Requiere Valoración
                      </span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleToggleActive(service)}
                      disabled={togglingId === service.serviceId}
                      className={`mt-2 w-full text-center py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                        service.isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {togglingId === service.serviceId
                        ? "Actualizando..."
                        : service.isActive
                          ? "Desactivar Servicio"
                          : "Reactivar Servicio"}
                    </button>
                    <button
                      onClick={() => handleHideService(service)}
                      disabled={togglingId === service.serviceId}
                      className="w-full text-center py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={() => fetchServices({ silent: true })}
        service={editingService}
      />
    </div>
  );
};

export default ServicesPage;
