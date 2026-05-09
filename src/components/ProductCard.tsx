'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useCartStore } from '@/store/useCartStore';
import { useProductModalStore } from '@/store/useProductModalStore';
import { ShoppingCart, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const { openModal } = useProductModalStore();

  const handleAddToCart = () => {
    addToCart(product);
  };

  const truncateName = (name: string, maxLength: number = 34) => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  const isOutOfStock = product.stock === undefined || product.stock <= 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  const getStockText = () => {
    if (isOutOfStock) return 'No disponible';
    if (isLowStock) return `Solo ${product.stock} disponibles`;
    return 'Disponible';
  };

  return (
    <div className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border flex flex-col h-full ${
      isOutOfStock ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-100'
    }`}>
      {/* Imagen optimizada para mobile */}
      <div 
        className="relative aspect-square bg-gray-100 sm:aspect-video md:aspect-square flex-shrink-0 cursor-pointer"
        onClick={() => openModal(product)}
      >
        {(product.image || product.thumbnail || product.imageUrl) ? (
          <Image
            src={product.image || product.thumbnail || product.imageUrl || ''}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src === product.image) {
                target.src = product.thumbnail || '';
              } else if (target.src === product.thumbnail) {
                target.src = product.imageUrl || '';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-xs sm:text-sm">Sin imagen</p>
            </div>
          </div>
        )}
        
        {/* Badge de categoría - optimizado para mobile */}
        {product.category && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
        )}
        
        {/* Badge de popularidad */}
        {product.isPopular && (
          <span className="absolute bottom-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            ¡Popular!
          </span>
        )}
        
        {/* Badge de stock */}
        {product.stock !== undefined && (
          <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full shadow-sm ${
            isOutOfStock ? 'bg-gray-500 text-white' : isLowStock ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {isOutOfStock ? 'Agotado' : isLowStock ? `${product.stock} u.` : 'Disponible'}
          </span>
        )}
      </div>
      
      {/* Contenido optimizado para mobile */}
      <div className="p-3 sm:p-4">
        <h3 className={`font-semibold text-sm sm:text-base mb-2 min-h-[1.5rem] ${
          isOutOfStock ? 'text-gray-400' : 'text-gray-900'
        }`}>
          {truncateName(product.name)}
        </h3>
        
        <p className={`text-xs sm:text-sm mb-3 line-clamp-2 min-h-[2rem] ${
          isOutOfStock ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Mostrar precios adaptados */}
            {product.adaptedPrices ? (
              <div className="space-y-1">
                <div className={`flex items-baseline space-x-1 ${
                  isOutOfStock ? 'text-gray-400' : 'text-green-600'
                }`}>
                  <span className="text-lg sm:text-xl font-bold">
                    Bs. {product.adaptedPrices.bs.toLocaleString()}
                  </span>
                </div>
                <div className={`flex items-baseline space-x-1 ${
                  isOutOfStock ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="text-xs sm:text-sm">
                    $ {product.adaptedPrices.usdAdjusted.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`flex items-baseline space-x-1 ${
                isOutOfStock ? 'text-gray-400' : 'text-green-600'
              }`}>
                <span className="text-lg sm:text-xl font-bold">
                  $ {product.price.toFixed(2)}
                </span>
              </div>
            )}
            {product.stock !== undefined && (
              <p className={`text-xs mt-1 hidden sm:block ${
                isOutOfStock ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {getStockText()}
              </p>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`p-2 sm:p-3 rounded-full transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md ml-2 ${
              isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isOutOfStock ? 'Producto agotado' : 'Agregar al carrito'}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
