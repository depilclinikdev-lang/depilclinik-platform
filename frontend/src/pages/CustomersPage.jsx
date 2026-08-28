import React, { useState, useEffect } from "react";
import api from "../services/api";
import { LuSearch, LuPlus, LuPencil, LuFileText } from "react-icons/lu";
import AddCustomerModal from "../components/AddCustomerModal";
import CustomerAssessmentHistoryPage from "./CustomerAssessmentHistoryPage";
import {
  showConfirm,
  showLoading,
  closeAlert,
  showToast,
  showError,
} from "../utils/alerts";

const CustomersPage = ({ currentUserRole }) => {
  const isAdmin = currentUserRole === "Administrador";
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [viewingAssessmentFor, setViewingAssessmentFor] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/customers");
      setCustomers(response.data);
      setError("");
    } catch (err) {
      setError("No se pudo conectar con el panel de clientes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      setEditingCustomer(response.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (customer) => {
    const willDeactivate = customer.isActive;
    const confirmed = await showConfirm({
      title: willDeactivate ? "¿Desactivar cliente?" : "¿Reactivar cliente?",
      text: willDeactivate
        ? `${customer.name} dejará de aparecer disponible para agendar nuevas citas. Su expediente e historial no se eliminan y podrás reactivarlo cuando quieras.`
        : `${customer.name} volverá a estar disponible para agendar citas. Su expediente e historial se mantienen sin cambios.`,
    });
    if (!confirmed) return;

    setTogglingId(customer.customerId);
    showLoading("Actualizando estado...");
    try {
      if (willDeactivate) {
        await api.patch(`/customers/${customer.customerId}/delete`);
      } else {
        await api.patch(`/customers/${customer.customerId}/reactivate`);
      }
      await fetchCustomers();
      closeAlert();
      showToast(
        "success",
        willDeactivate ? "Cliente desactivado" : "Cliente reactivado",
      );
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo actualizar el estado del cliente");
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };
  const handleHideCustomer = async (customer) => {
    const confirmed = await showConfirm({
      title: "¿Eliminar este cliente?",
      text: `"${customer.name}" dejará de verse en todo el sistema (clientes, agenda, paquetes y expedientes). Esta acción no se puede deshacer desde aquí.`,
      icon: "warning",
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    setTogglingId(customer.customerId);
    showLoading("Eliminando cliente...");
    try {
      await api.patch(`/customers/${customer.customerId}/hide`);
      await fetchCustomers();
      closeAlert();
      showToast("success", "Cliente eliminado del sistema");
    } catch (err) {
      closeAlert();
      showError("Error", "No se pudo eliminar el cliente");
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (viewingAssessmentFor) {
    return (
      <CustomerAssessmentHistoryPage
        customer={viewingAssessmentFor}
        onBack={() => setViewingAssessmentFor(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <LuSearch
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar Cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-borderClinik text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white transition-shadow"
          />
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold whitespace-nowrap">
            {filteredCustomers.length} cliente
            {filteredCustomers.length !== 1 ? "s" : ""}
          </span>

          {isAdmin && (
            <button
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              onClick={handleOpenCreate}
            >
              <LuPlus size={14} /> Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando clientes...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center font-medium p-8 text-sm">
            {error}
          </p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-accent text-center font-medium p-8 text-sm">
            No se encontraron clientes registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="border-b border-gray-100 bg-linear-to-r from-secondary/5 to-depil/5">
                  <th className="p-4 text-xs font-bold text-primary w-[25%]">
                    Cliente
                  </th>
                  <th className="p-4 text-xs font-bold text-primary w-[25%]">
                    Contacto
                  </th>
                  <th className="p-4 text-xs font-bold text-primary w-[15%]">
                    Género
                  </th>
                  <th className="p-4 text-xs font-bold text-primary w-[25%]">
                    Fecha Registro
                  </th>
                  {isAdmin && (
                    <th className="p-4 text-xs font-bold text-primary w-[20%] text-right">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const genderMeta = {
                    M: {
                      label: "Mujer",
                      className: "bg-depil-soft text-depil",
                    },
                    H: {
                      label: "Hombre",
                      className: "bg-secondary/10 text-secondary",
                    },
                    ND: { label: "ND", className: "bg-gray-100 text-gray-500" },
                  }[customer.gender] || {
                    label: customer.gender,
                    className: "bg-gray-100 text-gray-500",
                  };

                  const initials = customer.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={customer.customerId}
                      className="hover:bg-gray-50/50 transition-colors"
                      style={{ opacity: customer.isActive ? 1 : 0.5 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-secondary to-depil flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {customer.name} {!customer.isActive && "(Inactivo)"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 vertical-middle">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-primary">
                            {customer.phone}
                          </span>
                          <span className="text-xs text-accent truncate">
                            {customer.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 vertical-middle">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${genderMeta.className}`}
                        >
                          {genderMeta.label}
                        </span>
                      </td>
                      <td className="p-4 vertical-middle">
                        <span className="text-sm text-primary">
                          {new Date(
                            customer.createdAt || Date.now(),
                          ).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right vertical-middle">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setViewingAssessmentFor(customer)}
                              className="p-1.5 text-accent hover:text-depil transition-colors cursor-pointer"
                              title="Ver Historial de Expedientes"
                            >
                              <LuFileText size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleOpenEdit(customer.customerId)
                              }
                              className="p-1.5 text-accent hover:text-secondary transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <LuPencil size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(customer)}
                              disabled={togglingId === customer.customerId}
                              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${customer.isActive ? "bg-secondary" : "bg-gray-300"}`}
                              title={
                                customer.isActive ? "Desactivar" : "Activar"
                              }
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${customer.isActive ? "translate-x-5" : "translate-x-0"}`}
                              />
                            </button>
                            <button
                              onClick={() => handleHideCustomer(customer)}
                              disabled={togglingId === customer.customerId}
                              className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                              title="Eliminar cliente de la vista"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchCustomers}
        customer={editingCustomer}
      />
    </div>
  );
};

export default CustomersPage;
