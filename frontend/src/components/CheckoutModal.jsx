import React, { useState, useEffect } from "react";
import { LuX, LuPlus, LuTrash2 } from "react-icons/lu";
import api from "../services/api";
import { useBackButtonClose } from "../hooks/useBackButtonClose";
import {
  showLoading,
  closeAlert,
  showSuccess,
  showError,
} from "../utils/alerts";

const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Transferencia"];

const CheckoutModal = ({
  isOpen,
  appointment,
  onClose,
  onCompleted,
  onSkip,
}) => {
  useBackButtonClose(isOpen, onClose);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getServicePrice = (serviceObj) => {
    if (!serviceObj) return 0;
    return Number(
      serviceObj.price ??
        serviceObj.promoPrice ??
        serviceObj.regularPrice ??
        serviceObj.unitPrice ??
        0,
    );
  };

  useEffect(() => {
    if (isOpen && appointment) {
      setError("");
      setIsPartialPayment(false);
      setPartialAmount("");
      setPaymentMethod("Efectivo");

      const initialPrice =
        getServicePrice(appointment.service) ||
        Number(appointment.servicePrice || appointment.price || 0);

      const initialServiceId =
        appointment.serviceId || appointment.service?.serviceId || "";

      setItems([
        {
          serviceId: initialServiceId,
          name: appointment.service?.name || "",
          unitPrice: initialPrice,
          discountPercent: 0,
        },
      ]);

      const fetchServices = async () => {
        try {
          const brandParam = appointment.marca || appointment.brand || "";
          const response = await api.get(
            `/services?brand=${encodeURIComponent(brandParam)}`,
          );
          const fetchedServices = response.data || [];
          setServices(fetchedServices);

          if (initialServiceId) {
            const matchedService = fetchedServices.find(
              (s) => String(s.serviceId) === String(initialServiceId),
            );
            if (matchedService) {
              const realPrice = getServicePrice(matchedService);
              setItems([
                {
                  serviceId: matchedService.serviceId,
                  name: matchedService.name,
                  unitPrice: realPrice,
                  discountPercent: 0,
                },
              ]);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };

      fetchServices();
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value || 0);

  const totalAmount = items.reduce((sum, item) => {
    const unit = Number(item.unitPrice) || 0;
    const discount = Number(item.discountPercent) || 0;
    return sum + unit * (1 - discount / 100);
  }, 0);

  const amountToCharge = isPartialPayment
    ? Number(partialAmount) || 0
    : totalAmount;

  const handleAddItem = () => {
    const defaultService = services[0];
    const price = getServicePrice(defaultService);

    setItems((prev) => [
      ...prev,
      {
        serviceId: defaultService?.serviceId || "",
        name: defaultService?.name || "",
        unitPrice: price,
        discountPercent: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "serviceId") {
        const selectedService = services.find(
          (s) => String(s.serviceId) === String(value),
        );
        const price = getServicePrice(selectedService);

        updated[index] = {
          ...updated[index],
          serviceId: Number(value),
          name: selectedService?.name || "",
          unitPrice: price,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleConfirm = async () => {
    if (items.length === 0 || items.some((i) => !i.serviceId)) {
      setError("Selecciona al menos un servicio válido para la venta");
      return;
    }

    if (isPartialPayment && (!partialAmount || Number(partialAmount) <= 0)) {
      setError("Ingresa un monto válido para el pago parcial");
      return;
    }

    setLoading(true);
    setError("");
    showLoading("Registrando venta...");

    try {
      const response = await api.post("/sales", {
        appointmentId: appointment.appointmentId,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          unitPrice: Number(i.unitPrice),
          discountPercent: Number(i.discountPercent) || 0,
        })),
        amountPaid: amountToCharge,
        paymentMethod,
      });
      closeAlert();
      showSuccess("Venta registrada", `Folio ${response.data.folio}`);
      onCompleted(response.data);
    } catch (err) {
      closeAlert();
      const msg = err.response?.data?.message || "Error al registrar la venta";
      setError(msg);
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col text-left">
        <div className="px-7 py-6 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-primary font-heading tracking-wide">
              Cobrar Servicio
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              {appointment.customer?.name || "Cliente"} · {appointment.marca}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors cursor-pointer p-1"
          >
            <LuX size={22} />
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {error && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
              {error}
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Servicios vendidos *
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                <LuPlus size={14} /> Agregar servicio
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={item.serviceId}
                    onChange={(e) =>
                      handleItemChange(index, "serviceId", e.target.value)
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-primary bg-white focus:outline-none focus:border-secondary transition-colors"
                  >
                    <option value="">Selecciona un servicio</option>
                    {services.map((s) => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", e.target.value)
                      }
                      className="w-full pl-6 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-primary focus:outline-none focus:border-secondary transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "discountPercent",
                          e.target.value,
                        )
                      }
                      className="w-full px-2 py-2.5 rounded-xl border border-gray-200 text-xs text-primary focus:outline-none focus:border-secondary text-center font-semibold transition-colors"
                      placeholder="0%"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    >
                      <LuTrash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              Método de pago *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === method
                      ? "bg-secondary text-white border-secondary shadow-xs"
                      : "border-gray-200 text-primary hover:bg-gray-50 bg-white"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPartialPayment}
                onChange={(e) => setIsPartialPayment(e.target.checked)}
                className="accent-secondary h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              Registrar pago parcial (dejar saldo pendiente)
            </label>

            {isPartialPayment && (
              <div className="mt-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`Monto a cobrar ahora (máx $${totalAmount.toFixed(2)})`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-primary focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-4 flex flex-col gap-2 border border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-semibold">
                Total del servicio:
              </span>
              <span className="font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-semibold">
                Se cobra ahora:
              </span>
              <span className="font-extrabold text-primary text-sm">
                {formatCurrency(amountToCharge)}
              </span>
            </div>
            {isPartialPayment && (
              <div className="flex justify-between text-xs border-t border-gray-200 pt-2 mt-0.5">
                <span className="text-gray-500 font-semibold">
                  Saldo pendiente:
                </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(totalAmount - amountToCharge)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-7 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-2.5 rounded-full border border-gray-300 text-xs font-bold text-primary hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cobrar después
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-secondary hover:bg-[#14676f] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar Cobro"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
