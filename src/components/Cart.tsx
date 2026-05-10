'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useCartUIStore } from '@/store/useCartUIStore';
import { ShoppingCart, X, Minus, Plus, Trash2, MessageCircle, ShoppingBag, DollarSign, Clock, AlertTriangle } from 'lucide-react';

export default function Cart() {
  const { isOpen, openCart, closeCart } = useCartUIStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPriceWarningModal, setShowPriceWarningModal] = useState(false);
  const [hasCheckedPreviousOrder, setHasCheckedPreviousOrder] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { items, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();

  const total = getTotal();
  const itemCount = getItemCount();

  // Evitar error de hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verificar si hay carrito previo al cargar la página
  useEffect(() => {
    if (isMounted && !hasCheckedPreviousOrder && items.length > 0) {
      setShowConfirmModal(true);
      setHasCheckedPreviousOrder(true);
    }
  }, [isMounted, hasCheckedPreviousOrder]);

  const handleInitiateCheckout = (e: React.MouseEvent | React.FormEvent) => {
    // Previene que el navegador intente hacer un submit o recargar si es un form
    if (e && e.preventDefault) e.preventDefault();

    if (items.length === 0) return;

    // Mostrar modal de advertencia de precios antes de proceder
    setShowPriceWarningModal(true);
  };

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    const phoneNumber = '584141979720';
    const message = items
      .map((item, index) => {
        const unitPriceBs = item.adaptedPrices
          ? `Bs. ${item.adaptedPrices.bs.toLocaleString()}`
          : `Bs. ${(item.price * 35).toLocaleString()}`;
        const unitPriceUsd = `$${item.price.toFixed(2)}`;
        const itemTotalBs = item.adaptedPrices
          ? `Bs. ${(item.adaptedPrices.bs * item.quantity).toLocaleString()}`
          : `Bs. ${(item.price * 35 * item.quantity).toLocaleString()}`;
        const itemTotalUsd = `$${(item.price * item.quantity).toFixed(2)}`;
        return `${index + 1}. ID: ${item.id}\n   ${item.quantity}x ${item.name}\n   Precio unitario: ${unitPriceBs} (${unitPriceUsd})\n   Total: ${itemTotalBs} (${itemTotalUsd})`;
      })
      .join('\n\n');

    const totalBs = items.reduce((sum, item) => sum + (item.adaptedPrices?.bs || item.price * 35) * item.quantity, 0);
    const totalUsd = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const fullMessage = `Hola! Quiero realizar el siguiente pedido:\n\n${message}\n\nTOTAL DEL PEDIDO: Bs. ${totalBs.toLocaleString()} ($${totalUsd.toFixed(2)})`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullMessage)}`;

    // Redirigir a WhatsApp
    window.location.href = whatsappUrl;

    // Mostrar modal al regresar (si el usuario regresa)
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 1000);
  };

  const handleAcceptPriceWarning = () => {
    setShowPriceWarningModal(false);
    // Proceder con el checkout de WhatsApp
    handleWhatsAppCheckout();
  };

  const handleCancelPriceWarning = () => {
    setShowPriceWarningModal(false);
  };

  const handleConfirmOrder = () => {
    clearCart();
    closeCart();
    setShowConfirmModal(false);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  const getItemPrice = (item: any) => {
    if (item.adaptedPrices) {
      return (
        <div className="space-y-0.5">
          <div className="font-bold text-green-600">
            Bs. {(item.adaptedPrices.bs * item.quantity).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            $ {(item.adaptedPrices.usdAdjusted * item.quantity).toFixed(2)}
          </div>
        </div>
      );
    }
    return <span className="font-bold text-green-600">${(item.price * item.quantity).toFixed(2)}</span>;
  };

  const getTotalDisplay = () => {
    if (items.length > 0 && items[0]?.adaptedPrices) {
      const totalBs = items.reduce((sum, item) => sum + (item.adaptedPrices?.bs || item.price) * item.quantity, 0);
      const totalUsd = items.reduce((sum, item) => sum + (item.adaptedPrices?.usdAdjusted || item.price) * item.quantity, 0);
      return (
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-600">
            Bs. {totalBs.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            $ {totalUsd.toFixed(2)}
          </div>
        </div>
      );
    }
    return <span className="text-2xl font-bold text-green-600">${total.toFixed(2)}</span>;
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <button
        onClick={() => {
          openCart();
        }}
        className="!fixed !bottom-6 !right-6 !bg-blue-600 hover:!bg-blue-700 !text-white !p-4 !rounded-full !shadow-xl transition-all duration-300 !flex !items-center !justify-center !z-[9999] hover:!scale-110 !w-16 !h-16"
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', width: '4rem', height: '4rem' }}
        title="Ver carrito"
      >
        <ShoppingCart className="w-6 h-6" />
        {isMounted && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            {itemCount}
          </span>
        )}
      </button>

      {/* Modal del carrito */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mi Carrito</h2>
                  <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</p>
                </div>
              </div>
              <button
                onClick={() => closeCart()} // Use the global UI store for closing
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Cerrar"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Tu carrito está vacío</p>
                  <p className="text-gray-400 text-sm mt-2">Agrega productos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start space-x-4">
                        {/* Info del producto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                          )}
                          <div className="mt-2">
                            {getItemPrice(item)}
                          </div>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id.toString(), Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4 text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id.toString(), item.quantity + 1)}
                              className="w-8 h-8 rounded-md bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4 text-blue-700" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id.toString())}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con total y acciones */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 rounded-b-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  {getTotalDisplay()}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleInitiateCheckout}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Hacer Pedido</span>
                  </button>

                  <button
                    onClick={clearCart}
                    className="bg-white hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-xl transition-all duration-200 font-semibold border border-gray-300 shadow-sm"
                  >
                    Vaciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de advertencia de precios */}
      {showPriceWarningModal && (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 border-2 border-amber-200">
            <div className="p-6 sm:p-8">
              {/* Header con icono de alerta */}
              <div className="text-center mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <div className="relative">
                    <DollarSign className="w-10 h-10 text-amber-600" />
                    <Clock className="w-5 h-5 text-orange-500 absolute -top-1 -right-2" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Validación de Precios
                </h3>
              </div>

              {/* Mensaje de advertencia */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Los precios mostrados son válidos únicamente hasta las 
                      <span className="font-bold text-amber-700"> 6:00 PM </span> 
                      del día de hoy.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Pasada esta hora, los precios pueden variar según las tasas de cambio actualizadas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hora actual y límite */}
              <div className="flex items-center justify-center space-x-4 mb-6 text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Hora límite:</span>
                </div>
                <span className="font-bold text-amber-700 text-lg">6:00 PM</span>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleAcceptPriceWarning}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 uppercase tracking-wide"
                >
                  <span>Entendido, Hacer Pedido</span>
                </button>
                <button
                  onClick={handleCancelPriceWarning}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de compra anterior */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-6 sm:p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Terminaste tu compra anterior?</h3>
              <p className="text-gray-600 mb-6">Tienes productos en tu carrito. ¿Ya completaste tu compra anterior o deseas continuar con estos productos?</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Continuar comprando
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-all duration-200 font-semibold"
                >
                  Limpiar carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}