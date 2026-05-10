import { collection, onSnapshot, query, orderBy, getDocs, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { Product, convertTimestamp } from '@/types/product';
import { getTotalStock, subscribeToInventories } from './inventories';
import { calculateAdaptedPrices, getCachedExchangeRates, subscribeToExchangeRates } from './exchange-rates';
import { calculateProductPopularity, subscribeToPopularity, isProductPopular } from './history';
import { persistentCache } from './persistent-cache';

// Cache en memoria para productos
let productsCache: Product[] = [];
let listeners: (() => void)[] = [];
let lastUpdate = 0;
let isInitialLoad = true;
let hasLoadedFromCache = false;

// Configuración de caché
const CACHE_KEY = 'products';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas (Firebase tiene costos por lectura)

// Interface para suscriptores
export interface ProductsSubscriber {
  onProductsUpdate: (products: Product[]) => void;
  onError?: (error: Error) => void;
}

// Suscriptores actuales
const subscribers: Set<ProductsSubscriber> = new Set();

// Estados de carga
let isLoadingFromFirebase = false;

// Función para convertir datos de Firebase a Product
const convertFirebaseProduct = (id: string, data: any): Product => {
  return {
    id: data.id || id,
    name: data.name || '',
    price: data.price || 0,
    cost: data.cost,
    minQuantity: data.minQuantity,
    brandId: data.brandId,
    description: data.description || '',
    imageUrl: data.imageUrl || data.image || data.thumbnail || '',
    image: data.image,
    thumbnail: data.thumbnail,
    category: data.category || '',
    stock: data.stock || 0, // Mantener el stock original por si se necesita
    images: data.images,
    thumbnailsWebp: data.thumbnailsWebp,
    thumbnailWebp: data.thumbnailWebp,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

// Comparar si dos arrays de productos son diferentes
const hasProductsChanged = (oldProducts: Product[], newProducts: Product[]): boolean => {
  if (oldProducts.length !== newProducts.length) return true;
  
  const oldMap = new Map(oldProducts.map(p => [String(p.id), p.updatedAt]));
  
  for (const newProduct of newProducts) {
    const oldUpdatedAt = oldMap.get(String(newProduct.id));
    if (oldUpdatedAt !== newProduct.updatedAt) {
      return true;
    }
  }
  
  return false;
};

// Cargar productos desde caché persistente (llamada inmediata)
const loadFromPersistentCache = (): Product[] | null => {
  const cached = persistentCache.get<Product[]>(CACHE_KEY, CACHE_DURATION);
  if (cached && cached.length > 0) {
    productsCache = cached;
    hasLoadedFromCache = true;
    console.log(`[Cache] Loaded ${cached.length} products from persistent cache`);
    return cached;
  }
  return null;
};

// Guardar productos en caché persistente
const saveToPersistentCache = (products: Product[]): void => {
  persistentCache.set(CACHE_KEY, products);
  console.log(`[Cache] Saved ${products.length} products to persistent cache`);
};

// Estrategia: Primero caché local, luego Firebase con debounce
export const subscribeToProducts = (subscriber: ProductsSubscriber) => {
  subscribers.add(subscriber);
  
  // Cargar popularidad inicial
  calculateProductPopularity();
  
  // Suscribirse a actualizaciones de popularidad
  subscribeToPopularity((popularity) => {
    if (productsCache.length === 0) return;
    
    // Actualizar productos con nueva popularidad
    const updatedProducts = productsCache.map(product => ({
      ...product,
      popularity: popularity[String(product.id)] || 0,
      isPopular: isProductPopular(String(product.id))
    }));
    
    // Solo actualizar si hay cambios
    productsCache = updatedProducts;
    
    subscribers.forEach(sub => {
      try {
        sub.onProductsUpdate(productsCache);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
        sub.onError?.(error as Error);
      }
    });
  });
  
  // PRIORIDAD 1: Cargar desde caché persistente inmediatamente (sin esperar Firebase)
  if (!hasLoadedFromCache && productsCache.length === 0) {
    const cachedProducts = loadFromPersistentCache();
    if (cachedProducts) {
      subscriber.onProductsUpdate(cachedProducts);
    }
  } else if (productsCache.length > 0) {
    // Si ya hay datos en memoria, enviarlos
    subscriber.onProductsUpdate(productsCache);
  }
  
  // PRIORIDAD 2: Configurar suscripción a Firebase (solo si no hay listeners)
  if (listeners.length === 0) {
    isLoadingFromFirebase = true;
    
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('updatedAt', 'desc'));
    
    // Usar onSnapshot para actualizaciones en tiempo real
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true }, // Detectar cambios locales vs servidor
      async (snapshot) => {
        // Ignorar snapshots que vienen del caché local de Firebase (metadata)
        if (snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
          return; // Ya tenemos estos datos del caché persistente
        }
        
        const products: Product[] = [];
        
        snapshot.docChanges().forEach((change) => {
          // Procesar solo documentos modificados/añadidos/eliminados
          const data = change.doc.data();
          const product = convertFirebaseProduct(change.doc.id, data);
          product.stock = getTotalStock(product.id);
          
          const rates = getCachedExchangeRates();
          if (rates.dolarBCV > 0 && rates.dolarParalelo > 0) {
            product.adaptedPrices = calculateAdaptedPrices(
              product.price,
              rates.dolarBCV,
              rates.dolarParalelo
            );
          }
          
          products.push(product);
        });
        
        // Si no hubo cambios en los documentos, mantener caché actual
        if (products.length === 0 && productsCache.length > 0) {
          isLoadingFromFirebase = false;
          return;
        }
        
        // Reconstruir array completo de productos
        snapshot.forEach((doc) => {
          const existingIndex = products.findIndex(p => String(p.id) === doc.id);
          if (existingIndex === -1) {
            const data = doc.data();
            const product = convertFirebaseProduct(doc.id, data);
            product.stock = getTotalStock(product.id);
            
            const rates = getCachedExchangeRates();
            if (rates.dolarBCV > 0 && rates.dolarParalelo > 0) {
              product.adaptedPrices = calculateAdaptedPrices(
                product.price,
                rates.dolarBCV,
                rates.dolarParalelo
              );
            }
            products.push(product);
          }
        });
        
        // Obtener popularidad
        const popularity = await calculateProductPopularity();
        
        const newProducts = products.map(product => ({
          ...product,
          popularity: popularity[String(product.id)] || 0,
          isPopular: isProductPopular(String(product.id))
        }));
        
        // Solo actualizar si hay cambios reales
        const hasChanged = hasProductsChanged(productsCache, newProducts);
        
        if (hasChanged || productsCache.length === 0) {
          productsCache = newProducts;
          lastUpdate = Date.now();
          
          // Guardar en caché persistente
          saveToPersistentCache(productsCache);
          
          // Notificar suscriptores
          subscribers.forEach(sub => {
            try {
              sub.onProductsUpdate(productsCache);
            } catch (error) {
              console.error('Error notifying subscriber:', error);
              sub.onError?.(error as Error);
            }
          });
        }
        
        isLoadingFromFirebase = false;
        isInitialLoad = false;
      },
      (error) => {
        console.error('Error in products subscription:', error);
        isLoadingFromFirebase = false;
        subscribers.forEach(sub => {
          sub.onError?.(error);
        });
      }
    );
    
    listeners.push(unsubscribe);
  }
  
  return () => {
    subscribers.delete(subscriber);
    
    if (subscribers.size === 0) {
      listeners.forEach(unsubscribe => unsubscribe());
      listeners = [];
    }
  };
};

// Obtener productos del cache
export const getCachedProducts = (): Product[] => {
  return productsCache;
};

// Verificar si está cargando desde Firebase
export const isLoadingProducts = (): boolean => {
  return isLoadingFromFirebase;
};

// Verificar si es la carga inicial
export const isInitialProductLoad = (): boolean => {
  return isInitialLoad && !hasLoadedFromCache;
};

// Obtener estadísticas del caché
export const getCacheStats = (): { 
  memoryCacheCount: number; 
  hasPersistentCache: boolean;
  lastUpdate: number;
  isLoading: boolean;
} => {
  return {
    memoryCacheCount: productsCache.length,
    hasPersistentCache: persistentCache.isValid(CACHE_KEY),
    lastUpdate,
    isLoading: isLoadingFromFirebase,
  };
};

// Forzar recarga del cache
export const refreshProducts = () => {
  // Esto forzará una nueva actualización desde Firebase
  listeners.forEach(unsubscribe => unsubscribe());
  listeners = [];
  productsCache = [];
  
  // Si hay suscriptores, se volverán a suscribir automáticamente
  if (subscribers.size > 0) {
    // Crear nueva suscripción para el primer suscriptor
    const firstSubscriber = Array.from(subscribers)[0];
    if (firstSubscriber) {
      subscribeToProducts(firstSubscriber);
    }
  }
};

// Obtener productos con fallback si no hay cache
export const getProducts = async (): Promise<Product[]> => {
  // Si hay cache reciente (menos de 5 minutos), retornar cache
  if (productsCache.length > 0 && (Date.now() - lastUpdate) < 5 * 60 * 1000) {
    return productsCache;
  }
  
  // Si no hay cache o está desactualizada, retornar lo que haya
  return productsCache;
};

// Buscar productos en cache
export const searchProducts = (searchTerm: string): Product[] => {
  if (!searchTerm.trim()) return productsCache;
  
  const searchLower = searchTerm.toLowerCase();
  return productsCache.filter(product => {
    const name = product.name?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    
    return name.includes(searchLower) || description.includes(searchLower);
  });
};

// Limpiar todos los listeners
export const cleanup = () => {
  listeners.forEach(unsubscribe => unsubscribe());
  listeners = [];
  subscribers.clear();
  productsCache = [];
  hasLoadedFromCache = false;
  isInitialLoad = true;
};

// Precargar productos desde caché persistente (útil para SSR/hydration)
export const preloadFromCache = (): Product[] | null => {
  return loadFromPersistentCache();
};
