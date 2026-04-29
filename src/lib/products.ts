import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '@/types/product';

const PRODUCTS_COLLECTION = 'products';

export async function getProducts(limitCount?: number): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef, orderBy('createdAt', 'desc'));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: data.id || doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        cost: data.cost,
        minQuantity: data.minQuantity,
        brandId: data.brandId,
        imageUrl: data.imageUrl || '',
        category: data.category || '',
        stock: data.stock || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const querySnapshot = await getDocs(productsRef);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const name = data.name?.toLowerCase() || '';
      const description = data.description?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      if (name.includes(searchLower) || 
          description.includes(searchLower)) {
        products.push({
          id: data.id || doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          cost: data.cost,
          minQuantity: data.minQuantity,
          brandId: data.brandId,
          imageUrl: data.imageUrl || '',
          category: data.category || '',
          stock: data.stock || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: data.id || doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        cost: data.cost,
        minQuantity: data.minQuantity,
        brandId: data.brandId,
        imageUrl: data.imageUrl || '',
        category: data.category || '',
        stock: data.stock || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}
