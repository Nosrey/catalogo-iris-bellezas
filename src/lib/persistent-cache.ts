// Sistema de caché persistente usando localStorage
// Reduce llamadas a Firebase y mejora la experiencia de carga inicial

const CACHE_KEY = 'catalog_products_cache_v1';
const CACHE_TIMESTAMP_KEY = 'catalog_products_cache_timestamp_v1';
const CACHE_VERSION = 1;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

// Tiempo de expiración del caché (1 hora por defecto)
const DEFAULT_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hora en ms

export const persistentCache = {
  // Guardar datos en caché
  set: <T>(key: string, data: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Error saving to cache:', error);
      // Si localStorage está lleno, limpiar caché antiguo
      persistentCache.clear();
    }
  },

  // Obtener datos del caché
  get: <T>(key: string, maxAge: number = DEFAULT_CACHE_EXPIRY): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verificar versión del caché
      if (entry.version !== CACHE_VERSION) {
        persistentCache.remove(key);
        return null;
      }

      // Verificar si el caché expiró
      const age = Date.now() - entry.timestamp;
      if (age > maxAge) {
        return null; // Retornar datos aunque estén expirados (stale-while-revalidate)
      }

      return entry.data;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  },

  // Obtener datos incluso si están expirados (útil para mostrar algo mientras se actualiza)
  getStale: <T>(key: string): { data: T; isStale: boolean } | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (entry.version !== CACHE_VERSION) {
        persistentCache.remove(key);
        return null;
      }

      const age = Date.now() - entry.timestamp;
      const isStale = age > DEFAULT_CACHE_EXPIRY;

      return { data: entry.data, isStale };
    } catch (error) {
      console.warn('Error reading stale cache:', error);
      return null;
    }
  },

  // Verificar si el caché existe y es válido
  isValid: (key: string, maxAge: number = DEFAULT_CACHE_EXPIRY): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const item = localStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!item) return false;

      const entry: CacheEntry<unknown> = JSON.parse(item);
      
      if (entry.version !== CACHE_VERSION) return false;

      const age = Date.now() - entry.timestamp;
      return age <= maxAge;
    } catch {
      return false;
    }
  },

  // Obtener timestamp del último caché
  getTimestamp: (key: string): number | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${CACHE_KEY}_${key}`);
      if (!item) return null;

      const entry: CacheEntry<unknown> = JSON.parse(item);
      return entry.timestamp;
    } catch {
      return null;
    }
  },

  // Eliminar una entrada específica
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${CACHE_KEY}_${key}`);
  },

  // Limpiar todo el caché de la aplicación
  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  },

  // Obtener estadísticas del caché
  getStats: (): { size: number; entries: string[] } => {
    if (typeof window === 'undefined') return { size: 0, entries: [] };
    
    const entries: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY)) {
        entries.push(key.replace(`${CACHE_KEY}_`, ''));
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length * 2; // Aproximadamente 2 bytes por caracter
        }
      }
    }

    return { size: totalSize, entries };
  },
};

// Hook helper para React (usar en client components)
export const getCacheStatus = (): { 
  hasCache: boolean; 
  isStale: boolean; 
  lastUpdate: number | null;
  productCount: number;
} => {
  if (typeof window === 'undefined') {
    return { hasCache: false, isStale: false, lastUpdate: null, productCount: 0 };
  }

  const stale = persistentCache.getStale('products');
  if (!stale) {
    return { hasCache: false, isStale: false, lastUpdate: null, productCount: 0 };
  }

  const timestamp = persistentCache.getTimestamp('products');
  const products = stale.data as unknown[];

  return {
    hasCache: true,
    isStale: stale.isStale,
    lastUpdate: timestamp,
    productCount: products.length,
  };
};
