'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useProductModalStore } from '@/store/useProductModalStore';
import { ShoppingCart, X, Package, CheckCircle, AlertCircle, Heart, Sparkles, Crown } from 'lucide-react';

export default function ProductModal() {
  const addToCart = useCartStore((state) => state.addToCart);
  const { isOpen, product, closeModal } = useProductModalStore();

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4" onClick={closeModal}>
      <div 
        className="bg-white rounded-2xl w-[95vw] sm:w-[85vw] md:w-[70vw] lg:w-[60vw] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300 border border-rose-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header elegante */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-white/70 rounded-full transition-colors shadow-sm"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content elegante */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Imagen elegante */}
            <div className="w-full sm:w-56 flex-shrink-0">
              <div className="relative aspect-square bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl overflow-hidden shadow-lg border border-rose-100">
                {(product.image || product.thumbnail || product.imageUrl) ? (
                  <Image
                    src={product.image || product.thumbnail || product.imageUrl || ''}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 95vw, 224px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-300">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                {/* Badge premium */}
                {product.isPopular && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>PREMIUM</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info elegante */}
            <div className="flex-1 space-y-4">
              {product.category && (
                <span className="inline-block bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-medium border border-rose-200">
                  {product.category}
                </span>
              )}

              {product.description && (
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              )}

              {/* Precio elegante */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
                {product.adaptedPrices ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm text-rose-500 font-medium">Bs.</span>
                      <span className="text-2xl font-bold text-rose-600">
                        {product.adaptedPrices.bs.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      $ {product.adaptedPrices.usdAdjusted.toFixed(2)} USD
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-rose-600">
                    $ {product.price.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Disponibilidad elegante */}
              <div className="flex items-center space-x-2">
                {product.stock !== undefined && product.stock > 0 ? (
                  isLowStock ? (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 rounded-lg border border-orange-200">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-700 font-medium text-sm">¡Pocas unidades! Quedan solo {product.stock}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-700 font-medium text-sm">Disponible</span>
                    </div>
                  )
                ) : product.stock !== undefined ? (
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 font-medium text-sm">Agotado</span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Stock no disponible</span>
                )}
              </div>

              {/* Botón elegante */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <div className="bg-white/20 p-1 rounded-full">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span>{isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}</span>
                {!isOutOfStock && <Heart className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
