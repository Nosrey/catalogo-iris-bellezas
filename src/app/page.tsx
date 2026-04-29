'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { subscribeToProducts, getCachedProducts } from '@/lib/products-cache';
import { subscribeToInventories } from '@/lib/inventories';
import { filterProducts, FilterOptions } from '@/lib/filters';
import { subscribeToBrands, Brand } from '@/lib/brands';
import { subscribeToExchangeRates } from '@/lib/exchange-rates';
import SearchBar from '@/components/SearchBar';
import ProductGrid from '@/components/ProductGrid';
import Cart from '@/components/Cart';
import Filters, { FilterOptions as FilterOptionsType } from '@/components/Filters';
import Pagination from '@/components/Pagination';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptionsType>({
    searchTerm: '',
    minPrice: 0,
    maxPrice: Infinity,
    selectedBrands: []
  });

  const ITEMS_PER_PAGE = 40;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    // Suscribirse a inventarios primero para tener stock disponible
    const unsubscribeInventories = subscribeToInventories({
      onInventoriesUpdate: () => {
        // Los inventarios se cargaron, ahora suscribirse a productos
      },
      onError: (error) => {
        console.error('Error loading inventories:', error);
      }
    });

    // Suscribirse a tasas de cambio primero
    const unsubscribeExchangeRates = subscribeToExchangeRates({
      onExchangeRatesUpdate: () => {
        // Las tasas se cargaron, esto actualizará los productos automáticamente
      },
      onError: (error) => {
        console.error('Error loading exchange rates:', error);
      }
    });

    // Suscribirse a marcas
    const unsubscribeBrands = subscribeToBrands({
      onBrandsUpdate: (brands) => {
        setAvailableBrands(brands);
      },
      onError: (error) => {
        console.error('Error loading brands:', error);
      }
    });

    // Suscribirse a actualizaciones en tiempo real de productos
    const unsubscribeProducts = subscribeToProducts({
      onProductsUpdate: (products) => {
        setProducts(products);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    });

    // Cleanup al desmontar
    return () => {
      unsubscribeInventories();
      unsubscribeExchangeRates();
      unsubscribeBrands();
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    // Aplicar filtros cuando cambian los productos o los filtros
    const filtered = filterProducts(products, filters);
    setFilteredProducts(filtered);
    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [products, filters]);

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la página de productos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header optimizado para mobile */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Catálogo</h1>
            </div>
            
            <div className="flex-1 max-w-sm sm:max-w-md mx-2 sm:mx-8">
              <SearchBar onSearch={handleSearch} />
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {filteredProducts.length} productos
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content con layout mobile-first */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Hero Section optimizado para mobile */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Nuestros Productos
            </h2>
            <p className="mt-2 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base lg:text-xl text-gray-500 px-4">
              Descubre nuestra selección de productos de alta calidad
            </p>
          </div>
        </div>

        {/* Layout con sidebar en desktop, apilado en mobile */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filtros - sidebar en desktop, arriba en mobile */}
          <div className="lg:w-64 lg:flex-shrink-0">
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              availableBrands={availableBrands}
            />
          </div>

          {/* Productos */}
          <div className="flex-1">
            {/* Contador de productos mobile */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} productos encontrados
              </span>
            </div>

            <ProductGrid products={paginatedProducts} loading={loading} />
            
            {/* Paginación */}
            {!loading && paginatedProducts.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredProducts.length}
              />
            )}
          </div>
        </div>
      </main>

      <Cart />
    </div>
  );
}
