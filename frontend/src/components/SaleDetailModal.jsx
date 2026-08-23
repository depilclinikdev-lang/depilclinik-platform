import React, { useState } from "react";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import {
  LuX,
  LuReceipt,
  LuUser,
  LuCreditCard,
  LuPlus,
  LuCheck,
} from "react-icons/lu";
import api from "../services/api";

const STATUS_COLORS = {
  Liquidada: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  "Con adeudo": {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  Cancelada: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
  },
};

const SaleDetailModal = ({ isOpen, sale, onClose, onPaymentSuccess }) => {
  useBackButtonClose(isOpen, onClose);
  if (!isOpen || !sale) return null;

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value || 0);

  const formatDateTime = (value) =>
    new Date(value).toLocaleString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusMeta = STATUS_COLORS[sale.status] || STATUS_COLORS["Con adeudo"];
  const balance = parseFloat(sale.totalAmount) - parseFloat(sale.amountPaid);

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }

    if (paymentAmount > balance) {
      setError(
        `El abono no puede superar el saldo pendiente (${formatCurrency(balance)}).`,
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post(`/sales/${sale.saleId}/payments`, {
        amount: paymentAmount,
        paymentMethod,
      });

      setAmount("");
      setShowAddPayment(false);

      if (onPaymentSuccess) {
        onPaymentSuccess(sale.saleId);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al registrar el abono.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col text-left">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <LuReceipt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">{sale.folio}</h2>
              <p className="text-xs text-accent">
                {formatDateTime(sale.createdAt || sale.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-accent hover:text-primary text-sm font-bold cursor-pointer"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              {sale.status}
            </span>
            <span className="text-xs font-bold text-accent uppercase">
              {sale.marca}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50/70 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-2">
              <LuUser size={16} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-accent uppercase">
                  Cliente
                </p>
                <p className="text-sm font-semibold text-primary">
                  {sale.customer?.name || "—"}
                </p>
                <p className="text-xs text-accent">{sale.customer?.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <LuUser size={16} className="text-depil shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-accent uppercase">
                  Atendido por
                </p>
                <p className="text-sm font-semibold text-primary">
                  {sale.collaborator?.name || "Sin asignar"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-primary uppercase mb-2">
              Servicios
            </p>
            <div className="flex flex-col gap-2">
              {sale.items?.map((item) => (
                <div
                  key={item.saleItemId}
                  className="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                >
                  <span className="text-primary font-medium">
                    {item.service?.name || "Servicio"}
                    {Number(item.discountPercent) > 0 && (
                      <span className="ml-2 text-[11px] font-bold text-emerald-600">
                        -{item.discountPercent}%
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600 font-semibold">
                    {formatCurrency(
                      item.unitPrice * (1 - item.discountPercent / 100),
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                <LuCreditCard size={14} /> Abonos registrados
              </p>
              {balance > 0 && !showAddPayment && (
                <button
                  type="button"
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                >
                  <LuPlus size={14} /> Registrar Abono
                </button>
              )}
            </div>

            {showAddPayment && (
              <form
                onSubmit={handleRegisterPayment}
                className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 mb-3 flex flex-col gap-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-emerald-800">
                  <span>Nuevo Abono</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPayment(false);
                      setError("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Monto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Max: ${balance}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-secondary font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Método
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-secondary font-semibold"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] text-red-600 font-bold">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <LuCheck size={14} />{" "}
                  {loading ? "Guardando..." : "Confirmar Abono"}
                </button>
              </form>
            )}

            {sale.payments?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {sale.payments.map((p) => (
                  <div
                    key={p.paymentId}
                    className="flex items-center justify-between text-xs bg-gray-50/70 rounded-lg px-3 py-2"
                  >
                    <span className="text-gray-600">
                      {formatDateTime(p.paidAt)} · {p.paymentMethod}
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-accent">Sin abonos registrados.</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-accent font-medium">Total</span>
              <span className="font-bold text-primary">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-accent font-medium">Pagado</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(sale.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-accent font-medium">Saldo pendiente</span>
              <span
                className={`font-bold ${balance > 0 ? "text-red-600" : "text-gray-400"}`}
              >
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 bg-gray-50/70">
          <button
            onClick={onClose}
            className="w-full px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#14676f] transition-colors cursor-pointer shadow-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
