import React, { useState, useEffect, useRef } from "react";
import {
  LuBell,
  LuWallet,
  LuCalendar,
  LuChevronRight,
  LuCheckCheck,
  LuMenu,
} from "react-icons/lu";

const Navbar = ({
  pageTitle,
  userRole = "",
  userId = "anon",
  pendingSales = [],
  assignedAppointments = [],
  onSelectAppointment,
  onMenuClick,
}) => {
  const isDashboard = !pageTitle;
  const roleUpper = (userRole || "").toUpperCase();
  const isAdmin = roleUpper === "ADMINISTRADOR" || roleUpper === "ADMIN";

  const storageKey = `depilclinik_read_notifs_${userId}_${isAdmin ? "sales" : "appointments"}`;

  const loadReadIds = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(loadReadIds);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...readIds]));
    } catch {
      // sessionStorage puede fallar en modo incógnito; se ignora.
    }
  }, [readIds, storageKey]);

  const items = isAdmin ? pendingSales : assignedAppointments;

  const getItemId = (item) => {
    return item.appointmentId || item.id || item.saleId;
  };

  useEffect(() => {
    setReadIds((prev) => {
      const currentIds = new Set(items.map(getItemId));
      const pruned = new Set([...prev].filter((id) => currentIds.has(id)));
      return pruned.size === prev.size ? prev : pruned;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const unreadCount = items.filter(
    (item) => !readIds.has(getItemId(item)),
  ).length;

  const handleItemClick = (item) => {
    const id = getItemId(item);
    setReadIds((prev) => new Set(prev).add(id));
    setIsOpen(false);
    onSelectAppointment?.(item);
  };

  const handleMarkAllAsRead = () => {
    const allIds = items.map((item) => getItemId(item));
    setReadIds((prev) => {
      const newSet = new Set(prev);
      allIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  };

  return (
    <header className="sticky top-0 z-30 flex flex-row justify-between items-center px-4 sm:px-6 py-4 sm:py-5 bg-linear-to-r from-[#cbe4e6] via-[#e2eff1] to-[#f7d2e3] border-b border-gray-300 gap-4 w-full">
      <div className="flex items-center gap-3 text-left min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="sm:hidden p-2 -ml-1 rounded-lg text-primary hover:bg-white/60 transition-colors cursor-pointer shrink-0"
          aria-label="Abrir menú"
        >
          <LuMenu size={22} />
        </button>
        {isDashboard ? (
          <span className="text-xl sm:text-2xl font-black tracking-wider text-primary font-heading leading-none flex items-center gap-1.5 truncate">
            DEPILCLINIK
          </span>
        ) : (
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-heading leading-none truncate">
            {pageTitle}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
          title={isAdmin ? "Cobros pendientes" : "Servicios asignados"}
        >
          <LuBell size={22} className="text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <LuBell size={18} className="text-secondary" />
                <h3 className="text-sm font-bold text-primary">
                  {isAdmin ? "Cobros Pendientes" : "Servicios Asignados"}
                </h3>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LuCheckCheck size={12} /> Marcar leídas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent font-medium">
                  {isAdmin
                    ? "🎉 ¡Sin cobros pendientes!"
                    : "📅 No tienes nuevos servicios asignados por ahora."}
                </div>
              ) : (
                items.map((item) => {
                  const id = getItemId(item);
                  const isRead = readIds.has(id);

                  if (isAdmin) {
                    return (
                      <div
                        key={id}
                        onClick={() => handleItemClick(item)}
                        className={`p-3.5 transition-all cursor-pointer flex gap-3 items-center group ${
                          isRead
                            ? "bg-gray-50/60 opacity-50 hover:opacity-80"
                            : "bg-white hover:bg-amber-50/50"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isRead
                              ? "bg-gray-200 text-gray-500"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <LuWallet size={18} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-xs font-bold text-primary truncate">
                              {item.customer?.name || "Cliente"}
                            </p>
                            <span className="text-[11px] font-bold text-secondary shrink-0">
                              {item.service?.name || "Servicio"}
                            </span>
                          </div>
                          <p className="text-[10px] text-accent font-semibold">
                            {item.collaborator?.name ||
                              item.user?.name ||
                              "Colaborador"}
                          </p>
                          <p className="text-[10px] text-secondary font-bold flex items-center gap-0.5 mt-1">
                            {isRead ? "Revisado" : "Ir a agenda"}{" "}
                            <LuChevronRight size={12} />
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 transition-all cursor-pointer flex gap-3 items-center group ${
                        isRead
                          ? "bg-gray-50/60 opacity-50 hover:opacity-80"
                          : "bg-white hover:bg-secondary/5"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isRead
                            ? "bg-gray-200 text-gray-500"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        <LuCalendar size={18} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-primary group-hover:text-secondary transition-colors truncate">
                            {item.customerName ||
                              item.customer?.name ||
                              "Nuevo Cliente"}
                          </p>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 truncate">
                          Servicio:{" "}
                          <span className="font-semibold">
                            {item.serviceName ||
                              item.service?.name ||
                              "Tratamiento"}
                          </span>
                        </p>
                        <p className="text-[10px] text-accent mt-0.5">
                          {new Date(
                            item.startTime || item.start_time,
                          ).toLocaleString("es-MX", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
