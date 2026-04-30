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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
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
        
        {/* Badge de stock - nuevo */}
        {product.stock !== undefined && product.stock > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
            {product.stock} u.
          </span>
        )}
      </div>
      
      {/* Contenido optimizado para mobile */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 min-h-[1.5rem]">
          {truncateName(product.name)}
        </h3>
        
        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 min-h-[2rem]">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Mostrar precios adaptados */}
            {product.adaptedPrices ? (
              <div className="space-y-1">
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg sm:text-xl font-bold text-green-600">
                    Bs. {product.adaptedPrices.bs.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xs sm:text-sm text-gray-500">
                    $ {product.adaptedPrices.usdAdjusted.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline space-x-1">
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  $ {product.price.toFixed(2)}
                </span>
              </div>
            )}
            {product.stock !== undefined && (
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                Stock: {product.stock} unidades
              </p>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md ml-2"
            title="Agregar al carrito"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
