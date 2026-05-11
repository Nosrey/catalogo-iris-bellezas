'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { subscribeToProducts, getCachedProducts, isLoadingProducts, isInitialProductLoad, preloadFromCache } from '@/lib/products-cache';
import { subscribeToInventories } from '@/lib/inventories';
import { filterProducts, FilterOptions } from '@/lib/filters';
import { subscribeToBrands, Brand } from '@/lib/brands';
import { subscribeToExchangeRates } from '@/lib/exchange-rates';
import { useCartStore } from '@/store/useCartStore';
import { useCartUIStore } from '@/store/useCartUIStore';
import SearchBar from '@/components/SearchBar';
import ProductGrid from '@/components/ProductGrid';
import Cart from '@/components/Cart';
import ProductModal from '@/components/ProductModal';
import Filters, { FilterOptions as FilterOptionsType } from '@/components/Filters';
import Pagination from '@/components/Pagination';
import { ShoppingCart, Sparkles, Heart, Crown, Gem } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // Actualización en segundo plano
  const [hasCache, setHasCache] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptionsType>({
    searchTerm: '',
    minPrice: 0,
    maxPrice: Infinity,
    selectedBrands: [],
    sortBy: 'default'
  });
  const { items, getTotal } = useCartStore();
  const { openCart } = useCartUIStore();
  const [isMounted, setIsMounted] = useState(false);

  // Evitar error de hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ITEMS_PER_PAGE = 40;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    // PRIORIDAD 1: Intentar cargar desde caché persistente INMEDIATAMENTE
    const cachedProducts = preloadFromCache();
    if (cachedProducts && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      setHasCache(true);
      setCachedCount(cachedProducts.length);
      setLoading(false); // Mostrar datos inmediatamente
      console.log(`[Page] Loaded ${cachedProducts.length} products from cache instantly`);
    }

    // PRIORIDAD 2: Suscribirse a inventarios para stock
    const unsubscribeInventories = subscribeToInventories({
      onInventoriesUpdate: () => {},
      onError: (error) => {
        console.error('Error loading inventories:', error);
      }
    });

    // PRIORIDAD 3: Suscribirse a tasas de cambio
    const unsubscribeExchangeRates = subscribeToExchangeRates({
      onExchangeRatesUpdate: () => {},
      onError: (error) => {
        console.error('Error loading exchange rates:', error);
      }
    });

    // PRIORIDAD 4: Suscribirse a marcas
    const unsubscribeBrands = subscribeToBrands({
      onBrandsUpdate: (brands) => {
        setAvailableBrands(brands);
      },
      onError: (error) => {
        console.error('Error loading brands:', error);
      }
    });

    // PRIORIDAD 5: Suscribirse a productos de Firebase
    // Si ya tenemos caché, esto actualizará en segundo plano
    const unsubscribeProducts = subscribeToProducts({
      onProductsUpdate: (newProducts) => {
        const isFirstLoad = products.length === 0;
        const hasExistingCache = hasCache || cachedCount > 0;
        
        setProducts(newProducts);
        
        if (isFirstLoad && !hasExistingCache) {
          // Primera carga sin caché
          setLoading(false);
        } else if (hasExistingCache) {
          // Ya teníamos datos del caché, esto es una actualización
          setIsUpdating(false);
        }
      },
      onError: (error) => {
        console.error('Error loading products:', error);
        setLoading(false);
        setIsUpdating(false);
      }
    });

    // Detectar si Firebase está cargando (para mostrar indicador de sincronización)
    const checkFirebaseLoading = setInterval(() => {
      const firebaseLoading = isLoadingProducts();
      const initialLoad = isInitialProductLoad();
      
      if (firebaseLoading && !initialLoad && products.length > 0) {
        setIsUpdating(true);
      } else if (!firebaseLoading) {
        setIsUpdating(false);
      }
    }, 500);

    // Cleanup al desmontar
    return () => {
      unsubscribeInventories();
      unsubscribeExchangeRates();
      unsubscribeBrands();
      unsubscribeProducts();
      clearInterval(checkFirebaseLoading);
    };
  }, []);

  useEffect(() => {
    // Aplicar filtros cuando cambian los productos o los filtros
    const filtered = filterProducts(products, filters, availableBrands);
    setFilteredProducts(filtered);
    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [products, filters, availableBrands]);

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la página de productos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header elegante - Estilo Belleza */}
        <header className="bg-gradient-to-r from-white via-rose-50/50 to-white shadow-sm sticky top-0 z-40 border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-2 rounded-lg shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                    Iris Bellezas
                  </h1>
                  <p className="text-[10px] text-gray-400 tracking-wider hidden sm:block">ELEGANCIA & ESTILO</p>
                </div>
              </div>
              
              <div className="flex-1 max-w-sm sm:max-w-md mx-2 sm:mx-8">
                <SearchBar onSearch={handleSearch} />
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-1 text-rose-400">
                  <Heart className="w-3 h-3" />
                  <span className="text-xs text-gray-500">
                    {filteredProducts.length} productos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content con layout mobile-first */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Hero Section Elegante - Estilo Belleza */}
          <div className="mb-8 sm:mb-12">
            <div className="relative">
              {/* Decoración de fondo */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-rose-200/30 to-pink-300/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-amber-200/30 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative text-center py-8 sm:py-12 px-4">
                {/* Elementos decorativos superiores */}
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-rose-300 to-transparent"></div>
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-rose-300 to-transparent"></div>
                </div>
                
                {/* Título principal con fuente elegante */}
                <h2 className="font-script text-4xl sm:text-5xl lg:text-6xl text-rose-600 mb-2">
                  Iris Bellezas
                </h2>
                
                {/* Subtítulo */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-gray-500 font-medium">
                    Colección Exclusiva
                  </span>
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                
                {/* Descripción */}
                <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed px-4">
                  Descubre nuestra selección de productos premium para realzar tu belleza natural. 
                  <span className="hidden sm:inline"> Cada pieza está cuidadosamente elegida para ti.</span>
                </p>
                
                {/* Decoración inferior */}
                <div className="flex items-center justify-center mt-6 space-x-4">
                  <div className="flex items-center space-x-1 text-rose-400/60">
                    <Gem className="w-3 h-3" />
                    <div className="w-1 h-1 rounded-full bg-rose-400/60"></div>
                    <Heart className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Comprar elegante */}
          <div className="mb-8 flex justify-center">
            <button
              onClick={openCart}
              disabled={!isMounted || items.length === 0}
              className="group bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 rounded-full transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-rose-200/50 flex items-center space-x-3 text-lg border border-rose-400/20"
            >
              {/* Icono carrito - fondo blanco sólido para contraste */}
              <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5 text-rose-600" />
              </div>
              <span className="tracking-wide">HACER PEDIDO</span>
              {/* Badge de cantidad - fondo blanco sólido con borde */}
              <span className="bg-white text-rose-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-rose-100 min-w-[2rem] text-center">
                {isMounted ? items.length : 0}
              </span>
            </button>
          </div>

          {/* Layout con sidebar en desktop, apilado en mobile */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Filtros - sidebar en desktop, arriba en mobile */}
            <div className="lg:w-64 lg:flex-shrink-0">
              <Filters
                filters={filters}
                onFiltersChange={setFilters}
                availableBrands={availableBrands}
                products={products}
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

              <ProductGrid 
                products={paginatedProducts} 
                loading={loading} 
                isUpdating={isUpdating}
                cachedCount={cachedCount}
              />
              
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
              
              {/* Espacio al final cuando no hay paginación para evitar que el carrito tape el último producto */}
              {!loading && paginatedProducts.length > 0 && totalPages <= 1 && (
                <div className="h-24" />
              )}
            </div>
          </div>
        </main>
      </div>
      
      <Cart />
      <ProductModal />
    </>
  );
}
