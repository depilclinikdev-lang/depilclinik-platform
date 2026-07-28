import { useState } from "react";
import api from "../services/api";
import { LuEye, LuEyeOff } from "react-icons/lu";
import {
  showLoading,
  closeAlert,
  showError,
  showSuccess,
} from "../utils/alerts";

const LoginSPA = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [user, setUser] = useState(null);

  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    showLoading("Verificando credenciales...");

    try {
      const response = await api.post("/auth/login", { email, password });
      const loggedUser = response.data.user;
      setUser(loggedUser);
      closeAlert();

      if (loggedUser.mustChangePassword) {
        setMustChangePass(true);
      } else {
        const generoBD = loggedUser.gender
          ? String(loggedUser.gender).toUpperCase().trim()
          : "ND";
        const nombreUsuario = loggedUser.name || "";

        let saludoCompleto = "";

        if (generoBD === "H") {
          saludoCompleto = `¡Bienvenido de vuelta, ${nombreUsuario}!`;
        } else if (generoBD === "M") {
          saludoCompleto = `¡Bienvenida de vuelta, ${nombreUsuario}!`;
        } else {
          saludoCompleto = `¡Hola, ${nombreUsuario}!`;
        }

        showSuccess(saludoCompleto, "Inicio de sesión correcto");
        onLoginSuccess(loggedUser);
      }
    } catch (err) {
      closeAlert();
      const msg = err.response?.data?.message || "Credenciales incorrectas";
      setError(msg);
      showError("No se pudo iniciar sesión", msg);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPassError("");

    if (newPassword !== confirmPassword) {
      setPassError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    showLoading("Actualizando contraseña...");
    try {
      await api.post("/auth/change-password", { newPassword });
      closeAlert();
      showSuccess("Contraseña actualizada");
      setMustChangePass(false);
      onLoginSuccess({ ...user, mustChangePassword: false });
    } catch (err) {
      closeAlert();
      const msg =
        err.response?.data?.message || "Error al actualizar la contraseña";
      setPassError(msg);
      showError("Error", msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-r from-[#cbe4e6] via-[#e2eff1] to-[#f7d2e3] p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-125 h-125 bg-secondary/15 rounded-full blur-[100px] pointer-events-none animate-[float-blob-a_9s_ease-in-out_infinite]" />
      <div className="absolute -bottom-40 -right-40 w-125 h-125 bg-depil-soft/70 rounded-full blur-[100px] pointer-events-none animate-[float-blob-b_11s_ease-in-out_infinite]" />

      <div className="bg-white w-full max-w-212.5 min-h-125 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 border border-white/60 text-left animate-[card-in_0.6s_ease-out]">
        <div className="w-full md:w-[40%] bg-linear-to-br from-depil to-primary text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-white via-transparent to-black transform -skew-x-12 origin-top-left scale-150" />
            <div className="absolute -top-20 -left-20 w-80 h-80 border-4 border-white rounded-3xl transform rotate-45" />
            <div className="absolute -top-10 -left-10 w-80 h-80 border-4 border-white rounded-3xl transform rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col items-start gap-2 mt-16 w-full">
            <span className="text-2xl font-black tracking-widest">
              DEPILCLINIK
            </span>
            <span className="text-xs text-white/70 font-medium">
              Panel administrativo
            </span>
          </div>

          <div className="relative z-10 text-xs text-white/60 tracking-wide mt-auto text-center md:text-left">
            DEPILCLINIK © 2026
          </div>
        </div>

        <div className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full">
            {mustChangePass ? (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-depil-soft flex items-center justify-center border border-depil/20">
                    <svg
                      className="w-8 h-8 text-depil"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black tracking-widest text-depil uppercase mt-2 flex items-center gap-1">
                    Actualizar Contraseña
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  </h2>
                  <p className="text-xs text-accent text-center mt-2 max-w-xs">
                    Por seguridad, debes cambiar tu contraseña temporal antes de
                    continuar.
                  </p>
                </div>

                {passError && (
                  <p className="text-sm text-red-800 bg-red-100 p-3 rounded-lg mb-4 text-center border border-red-200">
                    {passError}
                  </p>
                )}

                <form
                  onSubmit={handlePasswordChangeSubmit}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-bold text-primary"
                    >
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full p-2.5 pr-10 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-secondary transition-colors cursor-pointer"
                        aria-label={
                          showNewPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showNewPassword ? (
                          <LuEyeOff size={18} />
                        ) : (
                          <LuEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-bold text-primary"
                    >
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full p-2.5 pr-10 rounded-lg border border-borderClinik text-sm focus:outline-none focus:border-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-secondary transition-colors cursor-pointer"
                        aria-label={
                          showConfirmPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showConfirmPassword ? (
                          <LuEyeOff size={18} />
                        ) : (
                          <LuEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 p-2.5 rounded-full bg-linear-to-r from-secondary to-depil text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    Guardar y Acceder
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-depil-soft flex items-center justify-center border border-depil/20">
                    <svg
                      className="w-8 h-8 text-depil"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black tracking-widest text-depil uppercase mt-2 flex items-center gap-1">
                    Iniciar Sesión
                  </h2>
                </div>

                {error && (
                  <p className="text-sm text-red-800 bg-red-100 p-3 rounded-lg mb-4 text-center border border-red-200">
                    {error}
                  </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="relative z-20 flex items-center gap-3 border-b border-borderClinik pb-2 group focus-within:border-secondary transition-colors">
                    <svg
                      className="w-5 h-5 text-accent group-focus-within:text-secondary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                      />
                    </svg>
                    <input
                      type="email"
                      placeholder="Email"
                      aria-label="Correo Electrónico"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-primary focus:outline-none placeholder-accent/70"
                    />
                  </div>

                  <div className="relative z-20 flex items-center gap-3 border-b border-borderClinik pb-2 group focus-within:border-secondary transition-colors">
                    <svg
                      className="w-5 h-5 text-accent group-focus-within:text-secondary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      aria-label="Contraseña"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-primary focus:outline-none placeholder-accent/70 pr-6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      className="text-accent hover:text-secondary transition-colors cursor-pointer shrink-0"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <LuEyeOff size={18} />
                      ) : (
                        <LuEye size={18} />
                      )}
                    </button>
                  </div>

                  <div className="relative z-20 flex items-center justify-between text-xs mt-2">
                    <button
                      type="submit"
                      className="px-8 py-2 rounded-full bg-linear-to-r from-secondary to-depil text-white text-sm font-bold hover:opacity-95 shadow-md transition-all transform active:scale-95 cursor-pointer uppercase tracking-wider"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSPA;
