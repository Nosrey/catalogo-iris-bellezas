import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Product, convertTimestamp } from '@/types/product';
import { getTotalStock, subscribeToInventories } from './inventories';
import { calculateAdaptedPrices, getCachedExchangeRates, subscribeToExchangeRates } from './exchange-rates';

// Cache en memoria para productos
let productsCache: Product[] = [];
let listeners: (() => void)[] = [];
let lastUpdate = 0;

// Interface para suscriptores
export interface ProductsSubscriber {
  onProductsUpdate: (products: Product[]) => void;
  onError?: (error: Error) => void;
}

// Suscriptores actuales
const subscribers: Set<ProductsSubscriber> = new Set();

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

// Suscribirse a actualizaciones en tiempo real
export const subscribeToProducts = (subscriber: ProductsSubscriber) => {
  subscribers.add(subscriber);
  
  // Si ya hay cache, enviar datos inmediatamente
  if (productsCache.length > 0) {
    subscriber.onProductsUpdate(productsCache);
  }
  
  // Si no hay listeners activos, crear uno nuevo
  if (listeners.length === 0) {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const products: Product[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const product = convertFirebaseProduct(doc.id, data);
          // Agregar stock total de todos los inventarios
          product.stock = getTotalStock(product.id);
          
          // Calcular precios adaptados si las tasas están disponibles
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
        
        productsCache = products;
        lastUpdate = Date.now();
        
        // Notificar a todos los suscriptores
        subscribers.forEach(sub => {
          try {
            sub.onProductsUpdate(products);
          } catch (error) {
            console.error('Error notifying subscriber:', error);
            sub.onError?.(error as Error);
          }
        });
      },
      (error) => {
        console.error('Error in products subscription:', error);
        subscribers.forEach(sub => {
          sub.onError?.(error);
        });
      }
    );
    
    listeners.push(unsubscribe);
  }
  
  // Retornar función para unsuscribir
  return () => {
    subscribers.delete(subscriber);
    
    // Si no hay más suscriptores, limpiar listeners
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
};
