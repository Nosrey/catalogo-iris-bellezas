import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface Brand {
  id: string;
  name: string;
  updatedAt?: any; // Firebase Timestamp
}

// Interface para suscriptores de marcas
export interface BrandsSubscriber {
  onBrandsUpdate: (brands: Brand[]) => void;
  onError?: (error: Error) => void;
}

// Cache en memoria para marcas
let brandsCache: Brand[] = [];
let brandListeners: (() => void)[] = [];
let brandSubscribers: Set<BrandsSubscriber> = new Set();

// Función para convertir datos de Firebase a Brand
const convertFirebaseBrand = (id: string, data: any): Brand => {
  return {
    id: data.id || id,
    name: data.name || '',
    updatedAt: data.updatedAt,
  };
};

// Suscribirse a actualizaciones de marcas en tiempo real
export const subscribeToBrands = (subscriber: BrandsSubscriber) => {
  brandSubscribers.add(subscriber);
  
  // Si ya hay cache, enviar datos inmediatamente
  if (brandsCache.length > 0) {
    subscriber.onBrandsUpdate(brandsCache);
  }
  
  // Si no hay listeners activos, crear uno nuevo
  if (brandListeners.length === 0) {
    const brandsRef = collection(db, 'brands');
    
    const unsubscribe = onSnapshot(
      brandsRef,
      (snapshot) => {
        const brands: Brand[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const brand = convertFirebaseBrand(doc.id, data);
          brands.push(brand);
        });
        
        brandsCache = brands;
        
        // Notificar a todos los suscriptores
        brandSubscribers.forEach(sub => {
          try {
            sub.onBrandsUpdate(brands);
          } catch (error) {
            console.error('Error notifying brand subscriber:', error);
            sub.onError?.(error as Error);
          }
        });
      },
      (error) => {
        console.error('Error in brands subscription:', error);
        brandSubscribers.forEach(sub => {
          sub.onError?.(error);
        });
      }
    );
    
    brandListeners.push(unsubscribe);
  }
  
  // Retornar función para unsuscribir
  return () => {
    brandSubscribers.delete(subscriber);
    
    // Si no hay más suscriptores, limpiar listeners
    if (brandSubscribers.size === 0) {
      brandListeners.forEach(unsubscribe => unsubscribe());
      brandListeners = [];
    }
  };
};

// Obtener marcas del cache
export const getCachedBrands = (): Brand[] => {
  return brandsCache;
};

// Obtener nombre de marca por ID
export const getBrandNameById = (brandId: string | null): string => {
  if (!brandId) return '';
  const brand = brandsCache.find(b => b.id === brandId);
  return brand?.name || '';
};

// Limpiar todos los listeners
export const cleanupBrands = () => {
  brandListeners.forEach(unsubscribe => unsubscribe());
  brandListeners = [];
  brandSubscribers.clear();
  brandsCache = [];
};
