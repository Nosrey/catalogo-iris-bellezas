import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Datos de ejemplo para poblar la base de datos
const sampleProducts = [
  {
    name: "Labial Matte Rojo Intenso",
    description: "Labial de larga duración con acabado mate perfecto",
    price: 15.99,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-279c5904d328?w=400",
    category: "Maquillaje",
    stock: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Máscara de Pestañas Volumen Extreme",
    description: "Añade volumen y longitud espectacular a tus pestañas",
    price: 12.50,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    category: "Maquillaje",
    stock: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Serum Facial Vitamina C",
    description: "Ilumina y revitaliza tu piel con vitamina C pura",
    price: 28.99,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a624e8d03?w=400",
    category: "Skincare",
    stock: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Base de Maquillaje HD",
    description: "Cobertura perfecta con acabado natural y duradero",
    price: 22.00,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-279c5904d328?w=400",
    category: "Maquillaje",
    stock: 40,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Crema Hidratante 24h",
    description: "Hidratación profunda y protección para todo el día",
    price: 18.75,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a624e8d03?w=400",
    category: "Skincare",
    stock: 35,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Delineador de Ojos Negro",
    description: "Delineador líquido con punta precisa para un trazo perfecto",
    price: 10.99,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    category: "Maquillaje",
    stock: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function seedDatabase() {
  try {
    const productsCollection = collection(db, 'products');
    
    for (const product of sampleProducts) {
      const docRef = doc(productsCollection);
      await setDoc(docRef, product);
      console.log(`Producto agregado: ${product.name}`);
    }
    
    console.log('Base de datos poblada exitosamente');
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
  }
}

// Para ejecutar: importar y llamar a seedDatabase() en algún componente o página
