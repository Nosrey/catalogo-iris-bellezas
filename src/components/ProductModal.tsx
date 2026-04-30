'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useProductModalStore } from '@/store/useProductModalStore';
import { ShoppingCart, X, Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProductModal() {
  const addToCart = useCartStore((state) => state.addToCart);
  const { isOpen, product, closeModal } = useProductModalStore();

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4" onClick={closeModal}>
      <div 
        className="bg-white rounded-xl w-[95vw] sm:w-[85vw] md:w-[70vw] lg:w-[60vw] max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
          <button
            onClick={closeModal}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content compacto */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Imagen compacta */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {(product.image || product.thumbnail || product.imageUrl) ? (
                  <Image
                    src={product.image || product.thumbnail || product.imageUrl || ''}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 95vw, 192px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>

            {/* Info compacta */}
            <div className="flex-1 space-y-3">
              {product.category && (
                <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
              )}

              {product.description && (
                <p className="text-gray-600 text-sm line-clamp-3">{product.description}</p>
              )}

              {/* Precio compacto */}
              <div>
                {product.adaptedPrices ? (
                  <div className="space-y-0.5">
                    <div className="text-xl font-bold text-green-600">
                      Bs. {product.adaptedPrices.bs.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      $ {product.adaptedPrices.usdAdjusted.toFixed(2)} USD
                    </div>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-green-600">
                    $ {product.price.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Disponibilidad compacta */}
              <div className="flex items-center space-x-2 text-sm">
                {product.stock !== undefined && product.stock > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">{product.stock} disponibles</span>
                  </>
                ) : product.stock !== undefined ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Agotado</span>
                  </>
                ) : (
                  <span className="text-gray-500">Stock no disponible</span>
                )}
              </div>

              {/* Botón compacto */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock !== undefined && product.stock <= 0}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar al Carrito</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
