import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import SaleDetailModal from "../components/SaleDetailModal";
import Employees from "./Employees";
import CustomersPage from "./CustomersPage";
import Agenda from "./Agenda";
import ServicesPage from "./ServicesPage";
import AssessmentHistoryPage from "./AssessmentHistoryPage";
import IngresosPage from "./IngresosPage";
import AdminOverview from "./AdminOverview";
import CollaboratorDashboard from "./CollaboratorDashboard";
import WhatsAppPage from "./WhatsAppPage";

const PAGE_TITLES = {
  empleados: "Gestión de Colaboradores",
  clientes: "Directorio de Clientes",
  "historial-expedientes": "Historial de Expedientes",
  agenda: "Agenda",
  servicios: "Catálogo de Servicios",
  ingresos: "Ingresos",
  confirmaciones: "Confirmaciones de Citas",
};

const DashboardPage = ({ user, onLogout, onAttendAppointment }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [pendingSales, setPendingSales] = useState([]);
  const [assignedAppointments, setAssignedAppointments] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchPendingAccounts = useCallback(async () => {
    if (user?.role !== "Administrador") return;
    try {
      const response = await api.get("/appointments/pending-checkouts");
      setPendingSales(response.data || []);
    } catch (err) {
      console.error("Error al obtener cuentas por cobrar para el Navbar:", err);
    }
  }, [user]);

  const fetchAssignedAppointments = useCallback(async () => {
    if (user?.role === "Administrador") return;
    try {
      const response = await api.get("/dashboard/my-today-appointments");
      setAssignedAppointments(response.data || []);
    } catch (err) {
      console.error("Error al obtener citas asignadas para el Navbar:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "Administrador") {
      fetchPendingAccounts();
      const interval = setInterval(fetchPendingAccounts, 30000);
      return () => clearInterval(interval);
    } else {
      fetchAssignedAppointments();
      const interval = setInterval(fetchAssignedAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchPendingAccounts, fetchAssignedAppointments]);

  const handleSelectAppointmentFromBell = () => {
    setActiveView("agenda");
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        if (user?.role !== "Administrador") {
          return (
            <CollaboratorDashboard
              userRole={user?.role}
              userName={user?.name}
            />
          );
        }
        return <AdminOverview userRole={user?.role} />;

      case "empleados":
        if (user?.role !== "Administrador") {
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tienes permisos para acceder a esta sección.
            </div>
          );
        }
        return <Employees currentUserRole={user?.role} />;

      case "clientes":
        if (user?.role !== "Administrador") {
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tienes permisos para acceder a esta sección.
            </div>
          );
        }
        return <CustomersPage currentUserRole={user?.role} />;

      case "historial-expedientes":
        if (user?.role !== "Administrador") {
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tienes permisos para acceder a esta sección.
            </div>
          );
        }
        return <AssessmentHistoryPage />;

      case "agenda":
        return (
          <Agenda
            currentUserRole={user?.role}
            onAttendAppointment={onAttendAppointment}
          />
        );

      case "servicios":
        return <ServicesPage currentUserRole={user?.role} />;

      case "ingresos":
        if (user?.role !== "Administrador") {
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tienes permisos para acceder a esta sección.
            </div>
          );
        }
        return <IngresosPage />;

      case "confirmaciones":
        if (user?.role !== "Administrador") {
          return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No tienes permisos para acceder a esta sección.
            </div>
          );
        }
        return <WhatsAppPage />;

      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Sección {activeView} en desarrollo.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#eef2f5] text-gray-800 font-sans antialiased">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        userRole={user?.role}
        userName={user?.name}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          pageTitle={PAGE_TITLES[activeView]}
          userRole={user?.role}
          userId={user?.id}
          pendingSales={user?.role === "Administrador" ? pendingSales : []}
          assignedAppointments={
            user?.role !== "Administrador" ? assignedAppointments : []
          }
          onSelectAppointment={handleSelectAppointmentFromBell}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>

      <SaleDetailModal
        isOpen={Boolean(selectedSale)}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onPaymentSuccess={async () => {
          fetchPendingAccounts();
          setSelectedSale(null);
        }}
      />
    </div>
  );
};

export default DashboardPage;
