import React, { useState, useEffect } from "react";
import { LuX, LuCopy, LuCheck, LuUserPlus } from "react-icons/lu";
import api from "../services/api";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const emptyFormState = {
  name: "",
  phone: "",
  email: "",
  birth: "",
  gender: "M",
  address: "",
  job_position: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_insurance_number: "",
  rol: "Colaborador",
};

const NewEmployeeModal = ({ isOpen, onClose, onRefresh, employee }) => {
  const isEditMode = Boolean(employee);

  const [formData, setFormData] = useState(emptyFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // 1. Declaramos primero la función de limpieza y cierre
  const handleCloseAndReset = () => {
    setGeneratedPassword("");
    setError("");
    setFormData(emptyFormState);
    onClose();
  };

  // 2. Usamos el hook de manera segura una vez que la función ya está declarada
  useBackButtonClose(isOpen, handleCloseAndReset);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setGeneratedPassword("");
      if (isEditMode) {
        setFormData({
          name: employee.name || "",
          phone: employee.phone || "",
          email: employee.email || "",
          birth: employee.birth ? employee.birth.slice(0, 10) : "",
          gender: employee.gender || "M",
          address: employee.address || "",
          job_position: employee.jobPosition || "",
          emergency_contact_name: employee.emergencyContactName || "",
          emergency_contact_phone: employee.emergencyContactPhone || "",
          medical_insurance_number: employee.medicalInsuranceNumber || "",
          rol: employee.role || "Colaborador",
        });
      } else {
        setFormData(emptyFormState);
      }
    }
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    showLoading(
      isEditMode ? "Guardando cambios..." : "Registrando colaborador...",
    );

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      role: formData.rol,
      birth: formData.birth || null,
      address: formData.address || null,
      jobPosition: formData.job_position || null,
      emergencyContactName: formData.emergency_contact_name || null,
      emergencyContactPhone: formData.emergency_contact_phone || null,
      medicalInsuranceNumber: formData.medical_insurance_number || null,
    };

    try {
      if (isEditMode) {
        await api.put(`/auth/usuarios/${employee.user_id}`, payload);
        closeAlert();
        showSuccess("Colaborador actualizado");
        if (onRefresh) onRefresh();
        handleCloseAndReset();
      } else {
        const response = await api.post("/auth/register", {
          ...payload,
          password: "",
        });
        closeAlert();
        if (response.status === 201) {
          setGeneratedPassword(response.data.temporaryPassword);
          if (onRefresh) onRefresh();
        }
      }
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message ||
        `Error interno al ${isEditMode ? "actualizar" : "registrar"} colaborador.`;
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-162.5 max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
        {generatedPassword ? (
          <div className="flex flex-col items-center py-6 text-center p-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
              <LuUserPlus size={32} />
            </div>
            <h2 className="text-xl font-bold text-primary mb-1">
              ¡Registro Exitoso!
            </h2>
            <p className="text-xs text-accent max-w-sm mb-6">
              El expediente de <strong>{formData.name}</strong> se ha guardado.
              Copia la siguiente contraseña temporal para que pueda realizar su
              primer inicio de sesión.
            </p>

            <div className="w-full max-w-xs bg-gray-50 border border-borderClinik rounded-xl p-4 flex items-center justify-between mb-8">
              <span className="font-mono text-lg font-bold tracking-wider text-primary select-all">
                {generatedPassword}
              </span>
              <button
                onClick={handleCopyPassword}
                className="p-2 text-secondary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Copiar contraseña"
              >
                {copied ? (
                  <LuCheck size={20} className="text-emerald-500" />
                ) : (
                  <LuCopy size={20} />
                )}
              </button>
            </div>

            <button
              onClick={handleCloseAndReset}
              className="px-8 py-2.5 rounded-full bg-secondary text-xs font-semibold text-white hover:bg-[#14676f] transition-colors cursor-pointer shadow-sm w-full max-w-xs"
            >
              Listo, Cerrar Ventana
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-start gap-3 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-primary m-0">
                  {isEditMode
                    ? "Editar Colaborador"
                    : "Registrar Nuevo Colaborador"}
                </h2>
              </div>
              <button
                onClick={handleCloseAndReset}
                className="text-accent hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                <LuX size={22} />
              </button>
            </div>

            <form
              id="employeeForm"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-left p-6 overflow-y-auto flex-1 custom-scrollbar"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 text-left font-medium">
                  {error}
                </div>
              )}

              <h3 className="text-sm font-semibold text-secondary border-b border-blue-100 pb-1 mt-1">
                Datos Personales
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Karelia Juárez"
                  className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@depilclinik.com"
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="6181234567"
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Género *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border border-borderClinik bg-white focus:outline-none focus:border-secondary"
                  >
                    <option value="M">Mujer</option>
                    <option value="H">Hombre</option>
                    <option value="ND">No Definido</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="birth"
                    value={formData.birth}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary">
                  Dirección Particular
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle, Número, Colonia..."
                  rows="2"
                  className="w-full p-2.5 rounded-lg border border-borderClinik resize-none focus:outline-none focus:border-secondary"
                />
              </div>

              <h3 className="text-sm font-semibold text-secondary border-b border-blue-100 pb-1 mt-2">
                Información Laboral
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Puesto de Trabajo
                  </label>
                  <input
                    type="text"
                    name="job_position"
                    value={formData.job_position}
                    onChange={handleChange}
                    placeholder="Ej. Especialista Láser"
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Rol de Sistema *
                  </label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border border-borderClinik bg-white focus:outline-none focus:border-secondary"
                  >
                    <option value="Colaborador">Colaborador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-primary">
                  Número de Seguro Médico (Único)
                </label>
                <input
                  type="text"
                  name="medical_insurance_number"
                  value={formData.medical_insurance_number}
                  onChange={handleChange}
                  placeholder="NSS de 11 dígitos"
                  className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                />
              </div>

              <h3 className="text-sm font-semibold text-secondary border-b border-blue-100 pb-1 mt-2">
                Contacto de Emergencia
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold text-primary">
                    Nombre del Contacto
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Ej. Mamá o Cónyuge"
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-primary">
                    Teléfono Contacto
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    maxLength="10"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="10 dígitos"
                    className="w-full p-2.5 rounded-lg border border-borderClinik focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            </form>

            <div className="border-t border-gray-100 bg-gray-50/70 p-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={loading}
                onClick={handleCloseAndReset}
                className="px-5 py-2 rounded-full border border-borderClinik text-xs font-semibold text-primary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="employeeForm"
                disabled={loading}
                className="px-5 py-2 rounded-full bg-secondary text-xs font-semibold text-white hover:bg-[#14676f] transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                {loading
                  ? isEditMode
                    ? "Guardando..."
                    : "Registrando..."
                  : isEditMode
                    ? "Guardar Cambios"
                    : "Enviar Invitación"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewEmployeeModal;
