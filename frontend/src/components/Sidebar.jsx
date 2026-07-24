import React from "react";
import {
  LuLayoutDashboard,
  LuBriefcase,
  LuCalendarDays,
  LuUser,
  LuUsers,
  LuCreditCard,
  LuLogOut,
  LuChevronDown,
  LuChevronRight,
  LuMessageCircle,
} from "react-icons/lu";

const getInitials = (name) => {
  if (!name) return "U";
  const words = name.trim().split(" ");
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Sidebar = ({
  activeView,
  setActiveView,
  onLogout,
  userRole,
  userName,
}) => {
  const [isClientesOpen, setIsClientesOpen] = React.useState(false);

  // 💡 Por defecto arranca colapsado (en chico)
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LuLayoutDashboard size={20} />,
    },
    { id: "servicios", label: "Servicios", icon: <LuBriefcase size={20} /> },
    { id: "agenda", label: "Agenda", icon: <LuCalendarDays size={20} /> },
    {
      id: "clientes",
      label: "Clientes",
      icon: <LuUser size={20} />,
      adminOnly: true,
      hasChildren: true,
      children: [
        {
          id: "historial-expedientes",
          label: "Historial de Expedientes",
        },
      ],
    },
    {
      id: "empleados",
      label: "Empleados",
      icon: <LuUsers size={20} />,
      adminOnly: true,
    },
    {
      id: "ingresos",
      label: "Ingresos",
      icon: <LuCreditCard size={20} />,
      adminOnly: true,
    },
    {
      id: "confirmaciones",
      label: "Confirmaciones",
      icon: <LuMessageCircle size={20} />,
      adminOnly: true,
    },
  ];

  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || userRole === "Administrador",
  );

  return (
    <aside
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`${isCollapsed ? "w-20" : "w-64"} h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 transition-all duration-300 relative`}
    >
      <div
        className={`w-full px-4 flex flex-col items-center justify-center text-center border-b border-gray-300 bg-linear-to-l from-[#cbe4e6] via-[#e2eff1] to-[#f7d2e3] transition-all duration-300 shrink-0 ${isCollapsed ? "h-20 gap-0" : "py-5 gap-2"}`}
      >
        <div className="w-11 h-11 shrink-0 rounded-full bg-linear-to-br from-secondary to-depil flex items-center justify-center text-white font-black text-sm shadow-md transition-transform duration-300">
          {getInitials(userName)}
        </div>

        {!isCollapsed && (
          <div className="overflow-hidden animate-[fadeIn_0.2s_ease-out] w-full mt-1">
            <p className="text-sm font-bold text-primary truncate max-w-50 mx-auto">
              {userName || "Usuario"}
            </p>
            <p className="text-[11px] font-bold text-gold uppercase tracking-wide mt-0.5">
              {userRole || "Colaborador"}
            </p>
          </div>
        )}
      </div>

      <nav
        className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} py-4 flex flex-col gap-1 overflow-y-auto transition-all`}
      >
        {visibleItems.map((item) => {
          const isActive = activeView === item.id;
          const isAnyChildActive = item.children?.some(
            (child) => activeView === child.id,
          );
          const isHighlighted = isActive || isAnyChildActive;

          return (
            <div key={item.id} className="w-full flex flex-col">
              <div
                data-cy={`nav-${item.id}`}
                onClick={() => {
                  setActiveView(item.id);
                  if (item.hasChildren) {
                    setIsClientesOpen(!isClientesOpen);
                  }
                }}
                className={`flex items-center ${isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-4 px-4 py-3.5 w-full"} rounded-xl text-sm font-bold transition-all cursor-pointer text-left ${
                  isHighlighted
                    ? "bg-linear-to-r from-secondary to-depil text-white shadow-md shadow-depil/20"
                    : "text-gray-500 hover:bg-secondary/5 hover:text-secondary"
                }`}
              >
                <span
                  className={`${isHighlighted ? "text-white" : "text-accent"} shrink-0 flex items-center justify-center`}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!isCollapsed && item.hasChildren && (
                  <span
                    className={isHighlighted ? "text-white" : "text-gray-400"}
                  >
                    {isClientesOpen ? (
                      <LuChevronDown size={16} />
                    ) : (
                      <LuChevronRight size={16} />
                    )}
                  </span>
                )}
              </div>

              {!isCollapsed && item.hasChildren && isClientesOpen && (
                <div className="flex flex-col gap-1 mt-1 pl-6 animate-[fadeIn_0.2s_ease-out]">
                  {item.children?.map((child) => {
                    const isChildActive = activeView === child.id;
                    return (
                      <div
                        key={child.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveView(child.id);
                        }}
                        className={`ml-2 mt-1 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left ${
                          isChildActive
                            ? "bg-depil-soft text-depil font-bold"
                            : "text-gray-400 hover:bg-gray-50 hover:text-secondary"
                        }`}
                      >
                        {child.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className={`${isCollapsed ? "p-2 text-center" : "p-4"} border-t border-gray-50 transition-all shrink-0`}
      >
        <div
          data-cy="nav-logout"
          onClick={onLogout}
          className={`flex items-center ${isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-4 px-4 py-3.5 w-full"} rounded-xl text-sm font-bold transition-all cursor-pointer text-left text-gray-500 hover:bg-red-50 hover:text-red-600`}
        >
          <span className="shrink-0 flex items-center justify-center">
            <LuLogOut size={20} />
          </span>
          {!isCollapsed && <span className="truncate">Cerrar Sesión</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
