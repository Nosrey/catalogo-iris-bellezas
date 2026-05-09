import { Product } from '@/types/product';
import { smartSearch } from './smartSearch';

export type SortOption = 'name-asc' | 'name-desc' | 'popularity-desc' | 'popularity-asc' | 'price-asc' | 'price-desc' | 'default';

export interface FilterOptions {
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  sortBy: SortOption;
}

// Filtrar productos según los criterios
export const filterProducts = (products: Product[], filters: FilterOptions): Product[] => {
  // Aplicar búsqueda inteligente primero si hay término de búsqueda
  let filteredProducts = products;
  
  if (filters.searchTerm.trim() !== '') {
    const searchResults = smartSearch(products, filters.searchTerm, {
      keys: ['name', 'description', 'id'],
      nameKey: 'name',
      minScore: 8,
      maxResults: undefined
    });
    filteredProducts = searchResults.map(r => r.item);
  }
  
  // Aplicar filtros adicionales
  filteredProducts = filteredProducts.filter(product => {
    // Filtrar por rango de precios (usar precios adaptados si están disponibles)
    const priceToFilter = product.adaptedPrices?.bs || product.price;
    if (priceToFilter < filters.minPrice || priceToFilter > filters.maxPrice) {
      return false;
    }
    
    // Filtrar por marcas seleccionadas
    if (filters.selectedBrands.length > 0) {
      if (!product.brandId || !filters.selectedBrands.includes(product.brandId)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Aplicar ordenamiento
  if (filters.sortBy !== 'default') {
    const sorted = [...filteredProducts];
    switch (filters.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'popularity-desc':
        sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'popularity-asc':
        sorted.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
        break;
      case 'price-asc':
        sorted.sort((a, b) => (a.price) - (b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.price) - (a.price));
        break;
    }
    filteredProducts = sorted;
  }
  
  return filteredProducts;
};
