import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Cache para popularidad de productos
let popularityCache: Record<string, number> = {};
let popularityListeners: (() => void)[] = [];
let lastPopularityUpdate = 0;

interface SalesItem {
  productDocId: string;
  quantity: number;
  name: string;
}

interface SalesDocument {
  id: string;
  soldAt: any;
  items: SalesItem[];
  refunded?: boolean;
}

// Calcular popularidad de productos desde el historial de ventas
export const calculateProductPopularity = async (): Promise<Record<string, number>> => {
  try {
    const sellsRef = collection(db, 'history', 'main', 'sells');
    // Obtener las últimas 500 ventas para calcular popularidad
    const q = query(sellsRef, orderBy('soldAt', 'desc'), limit(500));
    const snapshot = await getDocs(q);
    
    const popularity: Record<string, number> = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data() as SalesDocument;
      
      // Saltar ventas reembolsadas
      if (data.refunded) return;
      
      // Contar ventas de cada producto
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          const productId = item.productDocId;
          if (productId) {
            popularity[productId] = (popularity[productId] || 0) + (item.quantity || 1);
          }
        });
      }
    });
    
    popularityCache = popularity;
    lastPopularityUpdate = Date.now();
    
    return popularity;
  } catch (error) {
    console.error('Error calculating product popularity:', error);
    return popularityCache;
  }
};

// Suscribirse a actualizaciones de popularidad en tiempo real
export const subscribeToPopularity = (callback: (popularity: Record<string, number>) => void) => {
  const sellsRef = collection(db, 'history', 'main', 'sells');
  const q = query(sellsRef, orderBy('soldAt', 'desc'), limit(100));
  
  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const popularity: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data() as SalesDocument;
        
        if (data.refunded) return;
        
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            const productId = item.productDocId;
            if (productId) {
              popularity[productId] = (popularity[productId] || 0) + (item.quantity || 1);
            }
          });
        }
      });
      
      popularityCache = popularity;
      lastPopularityUpdate = Date.now();
      callback(popularity);
    },
    (error) => {
      console.error('Error in popularity subscription:', error);
    }
  );
  
  popularityListeners.push(unsubscribe);
  return unsubscribe;
};

// Obtener popularidad del cache
export const getCachedPopularity = (): Record<string, number> => {
  return popularityCache;
};

// Obtener popularidad de un producto específico
export const getProductPopularity = (productId: string): number => {
  return popularityCache[productId] || 0;
};

// Determinar si un producto es popular (estrictamente top 20%)
export const isProductPopular = (productId: string, minSales: number = 5): boolean => {
  const popularity = popularityCache[productId] || 0;
  
  // Mínimo de 5 ventas para ser considerado
  if (popularity < minSales) return false;
  
  // Estrictamente top 20% de productos con ventas
  const productSales = Object.values(popularityCache).filter((sales) => sales > 0);
  if (productSales.length === 0) return false;
  
  productSales.sort((a, b) => b - a);
  const top20PercentIndex = Math.ceil(productSales.length * 0.2);
  const top20PercentThreshold = productSales[top20PercentIndex - 1] || 0;
  
  return popularity >= top20PercentThreshold;
};

// Limpiar listeners de popularidad
export const cleanupPopularity = () => {
  popularityListeners.forEach(unsubscribe => unsubscribe());
  popularityListeners = [];
  popularityCache = {};
};
