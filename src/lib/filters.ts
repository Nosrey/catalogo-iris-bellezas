import { Product } from '@/types/product';
import { smartSearch } from './smartSearch';
import { Brand } from './brands';

export type SortOption = 'name-asc' | 'name-desc' | 'popularity-desc' | 'popularity-asc' | 'price-asc' | 'price-desc' | 'default';

export interface FilterOptions {
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  sortBy: SortOption;
}

// Normaliza un texto: minúsculas, sin acentos, sin espacios extras
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/\s+/g, '') // quitar todos los espacios
    .replace(/[^a-z0-9]/g, ''); // quitar caracteres especiales, dejar solo letras y números
};

// Verifica si el nombre de la marca aparece en el nombre del producto de forma permisiva
const brandMatchesProductName = (brandName: string, productName: string): boolean => {
  const normalizedBrand = normalizeText(brandName);
  const normalizedProduct = normalizeText(productName);

  // Si la marca normalizada está contenida en el nombre del producto normalizado
  return normalizedProduct.includes(normalizedBrand);
};

export interface PriceRange {
  min: number;
  max: number;
  label: string;
  count: number;
}

// Redondear a un número "bonito" (múltiplo de 10, 50, 100, 500, 1000 según la magnitud)
const roundNice = (value: number, roundUp: boolean = true): number => {
  const absValue = Math.abs(value);

  // Determinar el orden de magnitud
  let magnitude = 1;
  while (absValue / magnitude >= 100) {
    magnitude *= 10;
  }

  // Elegir el paso de redondeo según la magnitud
  let step: number;
  if (absValue / magnitude < 1) {
    step = magnitude / 10;
  } else if (absValue / magnitude < 5) {
    step = magnitude / 2;
  } else {
    step = magnitude;
  }

  // Ajustar para números más grandes
  if (absValue >= 1000) {
    step = Math.max(step, 100);
  }
  if (absValue >= 5000) {
    step = Math.max(step, 500);
  }
  if (absValue >= 10000) {
    step = Math.max(step, 1000);
  }

  if (roundUp) {
    return Math.ceil(value / step) * step;
  } else {
    return Math.floor(value / step) * step;
  }
};

// Calcular percentil de un array ordenado
const percentile = (sortedArr: number[], p: number): number => {
  if (sortedArr.length === 0) return 0;
  if (p <= 0) return sortedArr[0];
  if (p >= 100) return sortedArr[sortedArr.length - 1];

  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
};

// Encontrar "gaps" grandes en la distribución de precios (donde hay pocos productos)
const findPriceGaps = (prices: number[], minGapRatio: number = 0.3): number[] => {
  if (prices.length < 10) return [];

  const gaps: { index: number; size: number; ratio: number }[] = [];

  for (let i = 1; i < prices.length; i++) {
    const gap = prices[i] - prices[i - 1];
    const avgPrice = (prices[i] + prices[i - 1]) / 2;
    const ratio = gap / avgPrice;

    if (ratio > minGapRatio) {
      gaps.push({ index: i, size: gap, ratio });
    }
  }

  // Ordenar por tamaño de gap descendente y tomar los más significativos
  return gaps
    .sort((a, b) => b.size - a.size)
    .slice(0, 3) // Máximo 3 gaps importantes
    .map(g => prices[g.index]); // El precio donde ocurre el gap
};

// Encontrar el punto donde la mayoría de productos termina y empiezan los outliers caros
const findMajorityCutoff = (prices: number[]): { cutoff: number; majorityCount: number } => {
  if (prices.length < 20) return { cutoff: prices[prices.length - 1], majorityCount: prices.length };

  const total = prices.length;

  // Buscar desde el final hacia atrás un gap significativo
  // o donde el 90% de los productos estén por debajo
  const p90Index = Math.floor(total * 0.9);
  const p90Price = prices[p90Index];

  // Buscar un gap natural después del percentil 85
  const p85Index = Math.floor(total * 0.85);
  let bestGapIndex = -1;
  let bestGapRatio = 0;

  for (let i = p85Index + 1; i < Math.min(p85Index + Math.max(5, total * 0.05), total); i++) {
    const gap = prices[i] - prices[i - 1];
    const avgPrice = (prices[i] + prices[i - 1]) / 2;
    const ratio = gap / avgPrice;

    if (ratio > bestGapRatio && ratio > 0.3) {
      bestGapRatio = ratio;
      bestGapIndex = i;
    }
  }

  // Si encontramos un gap significativo después del 85%, usarlo
  if (bestGapIndex > 0) {
    return { cutoff: prices[bestGapIndex - 1], majorityCount: bestGapIndex };
  }

  // Si no, usar el percentil 90
  return { cutoff: p90Price, majorityCount: p90Index + 1 };
};

// Generar rangos de precio basados en la distribución REAL de productos
// Los rangos con más productos se dividen más, los con pocos se agrupan
export const generateDynamicPriceRanges = (products: Product[]): PriceRange[] => {
  if (products.length === 0) {
    return [{ min: 0, max: Infinity, label: 'Todos los precios', count: 0 }];
  }

  // Extraer precios (usando precios adaptados si están disponibles)
  const prices = products
    .map(p => p.adaptedPrices?.bs || p.price)
    .filter(p => p > 0 && isFinite(p))
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return [{ min: 0, max: Infinity, label: 'Todos los precios', count: 0 }];
  }

  const totalProducts = prices.length;
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  // Encontrar dónde termina la mayoría de productos y empiezan los outliers caros
  const { cutoff: majorityCutoff, majorityCount } = findMajorityCutoff(prices);
  const outlierCount = totalProducts - majorityCount;

  const splitPoints: number[] = [0]; // Siempre empezar en 0

  // Caso 1: Si hay una separación clara entre mayoría y outliers (detectado por gap en P85-P95)
  // O si hay más del 5% de outliers
  const hasSignificantGap = outlierCount > 0 && majorityCount < totalProducts;
  const hasManyOutliers = outlierCount > 0 && outlierCount / totalProducts > 0.05;

  if (hasSignificantGap || hasManyOutliers) {
    // Dividir la mayoría en 3-4 rangos (más granularidad donde hay más productos)
    const majorityRanges = Math.min(4, Math.max(3, Math.floor(majorityCount / 200)));
    const productsPerMajorityRange = Math.floor(majorityCount / majorityRanges);

    for (let i = 1; i < majorityRanges; i++) {
      const targetIndex = i * productsPerMajorityRange;
      let splitPrice = roundNice(prices[targetIndex], true);

      if (splitPrice > splitPoints[splitPoints.length - 1] + 100) {
        splitPoints.push(splitPrice);
      }
    }

    // Agregar el punto de corte de la mayoría (redondeado bonito)
    const cutoffRounded = roundNice(majorityCutoff, true);
    if (cutoffRounded > splitPoints[splitPoints.length - 1] + 100) {
      splitPoints.push(cutoffRounded);
    }

  } else {
    // Caso 2: No hay separación clara, usar cuantiles uniformes
    const targetRanges = Math.min(5, Math.max(3, Math.floor(totalProducts / 100)));
    const productsPerRange = Math.floor(totalProducts / targetRanges);

    for (let i = 1; i < targetRanges; i++) {
      const targetIndex = Math.min(i * productsPerRange, totalProducts - 1);
      let splitPrice = roundNice(prices[targetIndex], true);

      if (splitPrice > splitPoints[splitPoints.length - 1] + 100) {
        splitPoints.push(splitPrice);
      }
    }
  }

  // Ordenar y eliminar duplicados
  const uniquePoints = Array.from(new Set(splitPoints)).sort((a, b) => a - b);

  // Crear los rangos finales
  const ranges: PriceRange[] = [];

  for (let i = 0; i < uniquePoints.length; i++) {
    const rangeMin = uniquePoints[i];
    const rangeMax = i < uniquePoints.length - 1 ? uniquePoints[i + 1] : Infinity;

    // Contar productos en este rango
    const count = prices.filter(p => p >= rangeMin && (rangeMax === Infinity || p < rangeMax)).length;

    // Solo incluir rangos con productos
    if (count === 0) continue;

    let label: string;
    if (rangeMax === Infinity) {
      label = `Más de Bs. ${rangeMin.toLocaleString()}`;
    } else {
      label = `Bs. ${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()}`;
    }

    ranges.push({
      min: rangeMin,
      max: rangeMax,
      label,
      count
    });
  }

  return ranges;
};

// Filtrar productos según los criterios
export const filterProducts = (products: Product[], filters: FilterOptions, availableBrands: Brand[] = []): Product[] => {
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
      // Primero: verificar si el producto tiene brandId que coincida
      const matchesByBrandId = product.brandId && filters.selectedBrands.includes(product.brandId);

      // Segundo: si no coincide por brandId, buscar en el nombre del producto
      // para productos que tienen la marca en el nombre pero no en la etiqueta
      let matchesByName = false;
      if (!matchesByBrandId && product.name) {
        for (const brandId of filters.selectedBrands) {
          const brand = availableBrands.find(b => b.id === brandId);
          if (brand && brandMatchesProductName(brand.name, product.name)) {
            matchesByName = true;
            break;
          }
        }
      }

      if (!matchesByBrandId && !matchesByName) {
        return false;
      }
    }
    
    return true;
  });
  
  // Aplicar ordenamiento
  const sorted = [...filteredProducts];
  
  if (filters.sortBy !== 'default') {
    // Ordenamiento explícito seleccionado por usuario
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
  } else {
    // Ordenamiento por defecto (Relevancia)
    // SI HAY BÚSQUEDA: priorizar por relevancia (ya viene ordenado de smartSearch)
    // SI NO HAY BÚSQUEDA: priorizar productos CON STOCK primero, luego por MÁS RECIENTES
    if (filters.searchTerm.trim() === '') {
      // Sin búsqueda: ordenar por disponibilidad de stock + fecha de creación (más recientes primero)
      sorted.sort((a, b) => {
        const stockA = a.stock !== undefined && a.stock > 0 ? 1 : 0;
        const stockB = b.stock !== undefined && b.stock > 0 ? 1 : 0;

        // Primero: productos con stock (1) vs sin stock (0)
        if (stockA !== stockB) {
          return stockB - stockA; // Con stock primero
        }

        // Segundo: ordenar por fecha de creación (más recientes primero)
        // Esto hace que siempre se vean productos diferentes y nuevos al entrar
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA; // Más recientes primero
        }

        // Tercero: como fallback, ordenar aleatoriamente para variar la vista
        // Usar el ID del producto para generar un orden pseudo-aleatorio pero consistente
        return (a.id.toString()).localeCompare(b.id.toString());
      });
      filteredProducts = sorted;
    }
    // Si hay búsqueda, mantener el orden de relevancia de smartSearch
  }
  
  return filteredProducts;
};
