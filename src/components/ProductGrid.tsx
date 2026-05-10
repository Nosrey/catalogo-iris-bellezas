'use client';

import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import { Loader2, Package, Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  isUpdating?: boolean; // Nueva prop para indicar actualización en segundo plano
  cachedCount?: number; // Cantidad de productos en caché local
}

export default function ProductGrid({ products, loading, isUpdating, cachedCount }: ProductGridProps) {
  // Estado de carga inicial (sin productos, sin caché)
  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        {/* Spinner principal */}
        <div className="relative mb-6">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full"></div>
        </div>
        
        {/* Mensaje de carga */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
          CARGANDO CATÁLOGO
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-4">
          {cachedCount && cachedCount > 0 
            ? `Mostrando ${cachedCount} productos del caché local...`
            : 'Conectando con la base de datos por primera vez. Esto puede tomar un momento.'
          }
        </p>
        
        {/* Barra de progreso simulada */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-2 relative">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-1/2 animate-loading-bar absolute"></div>
        </div>
        <p className="text-xs text-gray-400">
          {cachedCount && cachedCount > 0 ? 'Sincronizando con servidor...' : 'Descargando productos...'}
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
        <p className="text-gray-500">Intenta ajustar tu búsqueda o revisa más tarde.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Indicador de actualización en segundo plano */}
      {isUpdating && (
        <div className="sticky top-20 z-30 mb-4 mx-auto max-w-fit">
          <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 shadow-md flex items-center space-x-2 animate-pulse">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700">
              SINCRONIZANDO...
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={String(product.id)} product={product} />
        ))}
      </div>
    </div>
  );
}
