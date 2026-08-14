import React, { useEffect, useState } from "react";
import api from "../services/api";
import { LuSearch, LuFileText } from "react-icons/lu";
import CustomerAssessmentHistoryPage from "./CustomerAssessmentHistoryPage";

const AssessmentHistoryPage = () => {
  const [modelhaRecords, setModelhaRecords] = useState([]);
  const [laserRecords, setLaserRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewingCustomerHistory, setViewingCustomerHistory] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [modelhaRes, laserRes] = await Promise.all([
          api.get("/assessments/all"),
          api.get("/laser-assessments/all"),
        ]);
        setModelhaRecords(modelhaRes.data || []);
        setLaserRecords(laserRes.data || []);
        setError("");
      } catch (err) {
        setError("No se pudo cargar el historial de expedientes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const combined = [
    ...modelhaRecords.map((r) => ({
      id: `modelha-${r.assessmentId}`,
      rawId: r.assessmentId,
      customerId: r.customerId || r.customer?.customerId,
      customerName: r.customer?.name || "—",
      customerPhone: r.customer?.phone || "",
      customer: r.customer,
      brand: "Modelha DK",
      createdAt: r.createdAt || r.created_at,
      reason: r.consultationReason || "Consulta General",
    })),
    ...laserRecords.map((r) => ({
      id: `laser-${r.laserAssessmentId}`,
      rawId: r.laserAssessmentId,
      customerId: r.customerId || r.customer?.customerId,
      customerName: r.customer?.name || "—",
      customerPhone: r.customer?.phone || "",
      customer: r.customer,
      brand: "Depilclinik",
      createdAt: r.createdAt || r.created_at,
      reason: r.referredMedia || "Depilación Láser",
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const now = new Date();
  const monthlyCount = combined.filter((record) => {
    if (!record.createdAt) return false;
    const created = new Date(record.createdAt);
    return (
      !isNaN(created.getTime()) &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const filtered = combined.filter((r) =>
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const brandColors = {
    "Modelha DK": "bg-secondary/10 text-secondary",
    Depilclinik: "bg-depil-soft text-depil",
  };

  if (viewingCustomerHistory) {
    return (
      <CustomerAssessmentHistoryPage
        customer={viewingCustomerHistory}
        onBack={() => setViewingCustomerHistory(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <LuSearch
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar por nombre de cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-borderClinik text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white transition-shadow"
          />
        </div>

        <span className="px-3 py-1.5 rounded-full bg-depil-soft text-depil text-xs font-bold whitespace-nowrap self-start sm:self-center">
          {monthlyCount} expediente{monthlyCount !== 1 ? "s" : ""} este mes
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-secondary text-center font-medium p-8 text-sm">
            Cargando historial...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center font-medium p-8 text-sm">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-accent text-center font-medium p-8 text-sm">
            No se encontraron expedientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="border-b border-gray-100 bg-linear-to-r from-secondary/5 to-depil/5">
                  <th className="p-4 text-xs font-bold text-primary">
                    Cliente
                  </th>
                  <th className="p-4 text-xs font-bold text-primary">Marca</th>
                  <th className="p-4 text-xs font-bold text-primary">Fecha</th>
                  <th className="p-4 text-xs font-bold text-primary">
                    Detalle
                  </th>
                  <th className="p-4 text-xs font-bold text-primary text-right">
                    Ver Expediente
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-sm font-semibold text-primary">
                        {record.customerName}
                      </span>
                      <p className="text-xs text-accent">
                        {record.customerPhone}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${brandColors[record.brand]}`}
                      >
                        {record.brand}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-primary">
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleDateString(
                            "es-MX",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "Sin fecha"}
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {record.reason}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() =>
                          setViewingCustomerHistory(record.customer)
                        }
                        className="p-1.5 text-accent hover:text-depil transition-colors cursor-pointer"
                        title="Ver Historial de Expedientes"
                      >
                        <LuFileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentHistoryPage;
