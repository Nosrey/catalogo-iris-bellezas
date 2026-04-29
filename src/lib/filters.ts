import { Product } from '@/types/product';

export interface FilterOptions {
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
}

// Filtrar productos según los criterios
export const filterProducts = (products: Product[], filters: FilterOptions): Product[] => {
  return products.filter(product => {
    // Filtrar por término de búsqueda
    if (filters.searchTerm.trim() !== '') {
      const searchLower = filters.searchTerm.toLowerCase();
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      
      if (!name.includes(searchLower) && !description.includes(searchLower)) {
        return false;
      }
    }
    
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
};
