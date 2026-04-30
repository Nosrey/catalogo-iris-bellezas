import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/product';

interface CartState {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (product) => set((state) => {
        const existingItem = state.items.find(item => String(item.id) === String(product.id));
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          const maxStock = existingItem.stock || Infinity;
          
          if (newQuantity > maxStock) {
            return state; // No cambiar si excede el stock
          }
          
          return {
            items: state.items.map(item =>
              String(item.id) === String(product.id)
                ? { ...item, quantity: newQuantity }
                : item
            )
          };
        }
        
        return {
          items: [...state.items, { ...product, quantity: 1 }]
        };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => String(item.id) !== String(productId))
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item =>
          String(item.id) === String(productId)
            ? { ...item, quantity: Math.max(1, Math.min(item.stock || Infinity, quantity)) }
            : item
        )
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);