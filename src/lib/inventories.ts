import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// Interface para inventario
export interface Inventory {
  id: string;
  name: string;
  products: { [productId: string]: { quantity: number } };
  updatedAt?: any; // Firebase Timestamp
}

// Interface para suscriptores de inventarios
export interface InventorySubscriber {
  onInventoriesUpdate: (inventories: Inventory[]) => void;
  onError?: (error: Error) => void;
}

// Cache en memoria para inventarios
let inventoriesCache: Inventory[] = [];
let inventoryListeners: (() => void)[] = [];
let inventorySubscribers: Set<InventorySubscriber> = new Set();

// Función para convertir datos de Firebase a Inventory
const convertFirebaseInventory = (id: string, data: any): Inventory => {
  return {
    id: data.id || id,
    name: data.name || '',
    products: data.products || {},
    updatedAt: data.updatedAt,
  };
};

// Obtener inventario activo desde localStorage
export const getActiveInventoryId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('activeInventoryId');
};

// Guardar inventario activo en localStorage
export const setActiveInventoryId = (inventoryId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('activeInventoryId', inventoryId);
};

// Suscribirse a actualizaciones de inventarios en tiempo real
export const subscribeToInventories = (subscriber: InventorySubscriber) => {
  inventorySubscribers.add(subscriber);
  
  // Si ya hay cache, enviar datos inmediatamente
  if (inventoriesCache.length > 0) {
    subscriber.onInventoriesUpdate(inventoriesCache);
  }
  
  // Si no hay listeners activos, crear uno nuevo
  if (inventoryListeners.length === 0) {
    const inventoriesRef = collection(db, 'inventories');
    const q = query(inventoriesRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const inventories: Inventory[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const inventory = convertFirebaseInventory(doc.id, data);
          inventories.push(inventory);
        });
        
        inventoriesCache = inventories;
        
        // Notificar a todos los suscriptores
        inventorySubscribers.forEach(sub => {
          try {
            sub.onInventoriesUpdate(inventories);
          } catch (error) {
            console.error('Error notifying inventory subscriber:', error);
            sub.onError?.(error as Error);
          }
        });
      },
      (error) => {
        console.error('Error in inventories subscription:', error);
        inventorySubscribers.forEach(sub => {
          sub.onError?.(error);
        });
      }
    );
    
    inventoryListeners.push(unsubscribe);
  }
  
  // Retornar función para unsuscribir
  return () => {
    inventorySubscribers.delete(subscriber);
    
    // Si no hay más suscriptores, limpiar listeners
    if (inventorySubscribers.size === 0) {
      inventoryListeners.forEach(unsubscribe => unsubscribe());
      inventoryListeners = [];
    }
  };
};

// Obtener inventarios del cache
export const getCachedInventories = (): Inventory[] => {
  return inventoriesCache;
};

// Obtener stock total de un producto sumando todos los inventarios
export const getTotalStock = (productId: string | number): number => {
  const productIdStr = String(productId);
  let totalStock = 0;
  
  inventoriesCache.forEach(inventory => {
    const productStock = inventory.products[productIdStr]?.quantity || 0;
    totalStock += productStock;
  });
  
  return totalStock;
};

// Obtener stock de un producto en un inventario específico
export const getStockInInventory = (productId: string | number, inventoryId: string): number => {
  const productIdStr = String(productId);
  const inventory = inventoriesCache.find(inv => inv.id === inventoryId);
  
  if (!inventory) return 0;
  
  return inventory.products[productIdStr]?.quantity || 0;
};

// Limpiar todos los listeners
export const cleanupInventories = () => {
  inventoryListeners.forEach(unsubscribe => unsubscribe());
  inventoryListeners = [];
  inventorySubscribers.clear();
  inventoriesCache = [];
};
