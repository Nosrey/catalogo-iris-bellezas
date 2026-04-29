'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/products';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    try {
      addLog('Iniciando prueba de conexión a Firebase...');
      
      // Test 1: Verificar configuración de Firebase
      addLog(`Firebase config: ${JSON.stringify(db)}`);
      
      // Test 2: Intentar leer la colección products
      addLog('Intentando leer colección products...');
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      addLog(`Documentos encontrados: ${querySnapshot.size}`);
      
      const productsData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        addLog(`Documento ID: ${doc.id}, Data: ${JSON.stringify(data)}`);
        productsData.push({ id: doc.id, ...data });
      });
      
      setProducts(productsData);
      addLog('✅ Conexión exitosa a Firebase');
      
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error('Firebase connection error:', error);
    }
  };

  const testGetProductsFunction = async () => {
    try {
      addLog('Probando función getProducts...');
      const products = await getProducts();
      addLog(`getProducts retornó ${products.length} productos`);
      products.forEach((product, index) => {
        addLog(`Producto ${index + 1}: ${JSON.stringify(product)}`);
      });
    } catch (error) {
      addLog(`❌ Error en getProducts: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Página de Depuración</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Pruebas de Conexión</h2>
          
          <div className="space-x-4 mb-6">
            <button
              onClick={testFirebaseConnection}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Probar Conexión Firebase
            </button>
            
            <button
              onClick={testGetProductsFunction}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Probar getProducts()
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400">Haz clic en los botones para ver los logs...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Productos Encontrados</h2>
          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-gray-500">No se encontraron productos</p>
            ) : (
              products.map((product, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-600">ID: {product.id}</p>
                  <p className="text-sm text-gray-600">Precio: ${product.price}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {JSON.stringify(product)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-500 hover:text-blue-600">
            ← Volver al catálogo
          </a>
        </div>
      </div>
    </div>
  );
}
