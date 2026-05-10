'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useCartStore } from '@/store/useCartStore';
import { useProductModalStore } from '@/store/useProductModalStore';
import { ShoppingCart, Plus, Heart, Sparkle } from 'lucide-react';

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
    if (isOutOfStock) return 'NO HAY';
    if (isLowStock) return `¡SOLO ${product.stock} DISPONIBLES!`;
    return 'DISPONIBLE';
  };

  return (
    <div className={`group rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border flex flex-col h-full ${
      isOutOfStock ? 'bg-gray-50 border-gray-200' : 'bg-white border-rose-100'
    } hover:border-rose-200 hover:-translate-y-1`}>
      {/* Imagen con overlay elegante */}
      <div 
        className="relative aspect-square bg-gradient-to-br from-rose-50 to-pink-50 sm:aspect-video md:aspect-square flex-shrink-0 cursor-pointer overflow-hidden"
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
          <div className="w-full h-full flex items-center justify-center text-rose-300">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
                <Sparkle className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-xs sm:text-sm uppercase text-rose-400">Sin imagen</p>
            </div>
          </div>
        )}
        
        {/* Badge de categoría - estilo elegante */}
        {product.category && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white text-[10px] px-3 py-1 rounded-full shadow-md uppercase tracking-wider font-medium">
            {product.category.toUpperCase()}
          </span>
        )}
        
        {/* Badge de popularidad - estilo premium */}
        {product.isPopular && (
          <span className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
            <Heart className="w-3 h-3 fill-current" />
            <span>PREMIUM</span>
          </span>
        )}
        
        {/* Badge de stock - estilo elegante */}
        {product.stock !== undefined && (
          <span className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full shadow-sm font-medium uppercase tracking-wider ${
            isOutOfStock 
              ? 'bg-gray-400 text-white' 
              : isLowStock 
                ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white' 
                : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
          }`}>
            {isOutOfStock ? 'Agotado' : isLowStock ? `${product.stock} u.` : 'Disponible'}
          </span>
        )}
      </div>
      
      {/* Contenido con estilo elegante */}
      <div className="p-4 sm:p-5">
        <h3 className={`font-medium text-sm sm:text-base mb-2 min-h-[1.5rem] leading-tight ${
          isOutOfStock ? 'text-gray-400' : 'text-gray-800'
        }`}>
          {truncateName(product.name)}
        </h3>
        
        <p className={`text-xs sm:text-sm mb-4 line-clamp-2 min-h-[2.5rem] text-gray-500 leading-relaxed ${
          isOutOfStock ? 'text-gray-400' : ''
        }`}>
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Mostrar precios adaptados */}
            {product.adaptedPrices ? (
              <div className="space-y-0.5">
                <div className={`flex items-baseline space-x-1 ${
                  isOutOfStock ? 'text-gray-400' : 'text-rose-600'
                }`}>
                  <span className="text-xs text-rose-400 font-medium">Bs.</span>
                  <span className="text-lg sm:text-xl font-bold">
                    {product.adaptedPrices.bs.toLocaleString()}
                  </span>
                </div>
                <div className={`flex items-baseline space-x-1 ${
                  isOutOfStock ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  <span className="text-[10px] sm:text-xs">
                    $ {product.adaptedPrices.usdAdjusted.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`flex items-baseline space-x-1 ${
                isOutOfStock ? 'text-gray-400' : 'text-rose-600'
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
            className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg ml-2 ${
              isOutOfStock 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white hover:scale-110'
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
