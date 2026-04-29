import { PriceCalculation } from '@/lib/exchange-rates';

export interface Product {
  id: string | number;
  name: string;
  price: number; // Precio base en USD (interno)
  cost?: number;
  minQuantity?: number;
  brandId?: string | null;
  description?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: string;
  category?: string;
  stock?: number;
  images?: string[];
  thumbnailsWebp?: string[];
  thumbnailWebp?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Precios adaptados (calculados)
  adaptedPrices?: PriceCalculation;
}

export interface CartItem extends Omit<Product, 'createdAt' | 'updatedAt'> {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Helper function para convertir Firebase Timestamp a Date
export const convertTimestamp = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  
  if (timestamp.type === 'firestore/timestamp/1.0') {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  
  return undefined;
};
