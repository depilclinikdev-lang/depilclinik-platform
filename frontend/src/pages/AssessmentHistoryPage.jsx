import React, { useEffect, useState } from "react";
import api from "../services/api";
import { LuSearch, LuFileText } from "react-icons/lu";
import AssessmentDetailModal from "../components/AssessmentDetailModal";
import CustomerAssessmentHistoryPage from "./CustomerAssessmentHistoryPage";
import ModelhaAssessmentForm from "../components/clinicalRecord/ModelhaAssessmentForm";
import LaserAssessmentForm from "../components/clinicalRecord/LaserAssessmentForm";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const AssessmentHistoryPage = () => {
  const [modelhaRecords, setModelhaRecords] = useState([]);
  const [laserRecords, setLaserRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewingAssessment, setViewingAssessment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState(null);

  const [editingAssessment, setEditingAssessment] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleOpenAssessmentDetail = async (record) => {
    setLoadingDetail(true);
    try {
      const endpoint =
        record.brand === "Modelha DK"
          ? `/assessments/${record.rawId}`
          : `/laser-assessments/${record.rawId}`;

      const response = await api.get(endpoint);
      setViewingAssessment(response.data);
      setEditingBrand(record.brand); // 👈 guarda la marca aquí
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el expediente seleccionado.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewFullHistory = (customer) => {
    setViewingAssessment(null);
    setViewingCustomerHistory(customer);
  };

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
  const handleEditFromModal = (assessment) => {
    setEditingBrand(viewingAssessment?.marca || null);
    setEditingAssessment(assessment);
    setViewingAssessment(null);
  };

  const handleUpdateAssessment = async (formPayload) => {
    setSaving(true);
    showLoading("Guardando cambios...");
    try {
      const idKey =
        editingBrand === "Modelha DK" ? "assessmentId" : "laserAssessmentId";
      const endpoint =
        editingBrand === "Modelha DK"
          ? `/assessments/${editingAssessment[idKey]}`
          : `/laser-assessments/${editingAssessment[idKey]}`;

      await api.put(endpoint, formPayload);

      closeAlert();
      showSuccess("Expediente actualizado");
      setEditingAssessment(null);

      // Refresca las listas para que el resumen actualizado se vea
      const [modelhaRes, laserRes] = await Promise.all([
        api.get("/assessments/all"),
        api.get("/laser-assessments/all"),
      ]);
      setModelhaRecords(modelhaRes.data || []);
      setLaserRecords(laserRes.data || []);
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
                        onClick={() => handleOpenAssessmentDetail(record)}
                        disabled={loadingDetail}
                        className="p-1.5 text-accent hover:text-depil transition-colors cursor-pointer disabled:opacity-40"
                        title="Ver Expediente"
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

      <AssessmentDetailModal
        isOpen={Boolean(viewingAssessment)}
        assessment={viewingAssessment}
        onClose={() => setViewingAssessment(null)}
        onViewFullHistory={handleViewFullHistory}
        onEdit={handleEditFromModal}
      />

      {editingAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col text-left">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <h2 className="text-lg font-bold text-primary">
                Editar Expediente — {editingAssessment.customer?.name || ""}
              </h2>
              <button
                onClick={() => setEditingAssessment(null)}
                className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              {editingBrand === "Modelha DK" ? (
                <ModelhaAssessmentForm
                  onSubmit={handleUpdateAssessment}
                  saving={saving}
                  customerName={editingAssessment.customer?.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  initialData={editingAssessment}
                  isEditMode
                />
              ) : (
                <LaserAssessmentForm
                  onSubmit={handleUpdateAssessment}
                  saving={saving}
                  customerName={editingAssessment.customer?.name}
                  pendingPhotos={{}}
                  onPhotoSelect={() => {}}
                  initialData={editingAssessment}
                  isEditMode
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentHistoryPage;
