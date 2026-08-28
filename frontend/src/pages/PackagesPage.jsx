import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  LuPlus,
  LuSearch,
  LuCalendarPlus,
  LuWallet,
  LuPencil,
} from "react-icons/lu";
import SellPackageModal from "../components/SellPackageModal";
import PackageDetailModal from "../components/PackageDetailModal";
import EditPackageModal from "../components/EditPackageModal";
import {
  showLoading,
  closeAlert,
  showError,
  showConfirm,
  showToast,
} from "../utils/alerts";

const BRAND_COLORS = { "Modelha DK": "#197e88", Depilclinik: "#c0247d" };

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [marca, setMarca] = useState("");
  const [statusFilter, setStatusFilter] = useState("Activo");
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/packages", {
        params: {
          marca: marca || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        },
      });
      setPackages(response.data);
      setError("");
    } catch (err) {
      setError("No se pudieron cargar los paquetes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [marca, statusFilter, search]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchPackages, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPackages]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v || 0);

  const handleOpenDetail = async (packageId) => {
    try {
      showLoading("Cargando paquete...");
      const response = await api.get(`/packages/${packageId}`);
      closeAlert();
      setSelectedPackage(response.data);
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo cargar el detalle del paquete");
    }
  };

  const handleHidePackage = async (pkg) => {
    const confirmed = await showConfirm({
      title: "¿Eliminar este paquete?",
      text: `El paquete de "${pkg.customer?.name}" dejará de verse en el sistema y sus pagos ya no contarán en los ingresos. Esta acción no se puede deshacer desde aquí.`,
      icon: "warning",
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    showLoading("Eliminando paquete...");
    try {
      await api.patch(`/packages/${pkg.packageId}/hide`);
      await fetchPackages();
      closeAlert();
      showToast("success", "Paquete eliminado correctamente");
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo eliminar el paquete");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {["", "Modelha DK", "Depilclinik"].map((brand) => (
            <button
              key={brand || "todas"}
              onClick={() => setMarca(brand)}
              className="px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm"
              style={
                marca === brand
                  ? {
                      backgroundColor: brand ? BRAND_COLORS[brand] : "#012438",
                      borderColor: brand ? BRAND_COLORS[brand] : "#012438",
                      color: "#fff",
                    }
                  : {
                      borderColor: "#e5e7eb",
                      color: "#6b7280",
                      backgroundColor: "#fff",
                    }
              }
            >
              {brand || "Todas"}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Completado">Completados</option>
          <option value="Cancelado">Cancelados</option>
        </select>

        <div className="relative flex-1 min-w-56">
          <LuSearch
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm bg-gray-50/70"
          />
        </div>

        <button
          onClick={() => setIsSellModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-black text-sm hover:opacity-95 transition-all cursor-pointer shrink-0"
        >
          <LuPlus size={15} /> Vender Paquete
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando paquetes...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center font-medium p-8 text-sm">
            {error}
          </p>
        ) : packages.length === 0 ? (
          <p className="text-accent text-center font-medium p-8 text-sm">
            No se encontraron paquetes con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-175">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="p-4 text-xs font-bold text-primary">
                    Cliente
                  </th>
                  <th className="p-4 text-xs font-bold text-primary">
                    Servicio
                  </th>
                  <th className="p-4 text-xs font-bold text-primary">
                    Progreso
                  </th>
                  <th className="p-4 text-xs font-bold text-primary">Pago</th>
                  <th className="p-4 text-xs font-bold text-primary">Estado</th>
                  <th className="p-4 text-xs font-bold text-primary text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.map((pkg) => {
                  const progressPct =
                    (pkg.sessionsCompleted / pkg.totalSessions) * 100;
                  return (
                    <tr key={pkg.packageId} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <span className="text-sm font-semibold text-primary">
                          {pkg.customer?.name}
                        </span>
                        <p className="text-xs text-accent">
                          {pkg.customer?.phone}
                        </p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {pkg.service?.name}
                        <p
                          className="text-[11px]"
                          style={{ color: BRAND_COLORS[pkg.marca] }}
                        >
                          {pkg.marca}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 w-24 overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-secondary to-depil rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-primary whitespace-nowrap">
                            {pkg.sessionsCompleted}/{pkg.totalSessions}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            pkg.paymentStatus === "Pagado"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {pkg.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-gray-600">
                          {pkg.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(pkg.packageId)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary/10 text-secondary font-bold text-xs hover:bg-secondary/20 transition-colors cursor-pointer"
                          >
                            <LuCalendarPlus size={14} /> Agendar
                          </button>
                          <button
                            onClick={() => handleHidePackage(pkg)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setEditingPackage(pkg)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            <LuPencil size={14} /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SellPackageModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onRefresh={fetchPackages}
      />

      <PackageDetailModal
        isOpen={Boolean(selectedPackage)}
        pkg={selectedPackage}
        onClose={() => setSelectedPackage(null)}
        onRefresh={async () => {
          await fetchPackages();
          if (selectedPackage)
            await handleOpenDetail(selectedPackage.packageId);
        }}
      />
      <EditPackageModal
        isOpen={Boolean(editingPackage)}
        pkg={editingPackage}
        onClose={() => setEditingPackage(null)}
        onRefresh={fetchPackages}
      />
    </div>
  );
};

export default PackagesPage;
