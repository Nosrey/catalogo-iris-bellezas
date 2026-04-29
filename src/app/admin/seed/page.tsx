'use client';

import { useState } from 'react';
import { seedDatabase } from '@/lib/seed-data';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    try {
      setLoading(true);
      setMessage('');
      await seedDatabase();
      setMessage('Base de datos poblada exitosamente! Revisa el catálogo principal.');
    } catch (error) {
      setMessage('Error al poblar la base de datos. Revisa la consola para más detalles.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Poblar Base de Datos</h1>
        
        <p className="text-gray-600 mb-6">
          Esta página agregará productos de ejemplo a tu base de datos de Firebase para que puedas probar el catálogo.
        </p>
        
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {loading ? 'Poblando...' : 'Poblar Base de Datos'}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('exitosamente') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← Volver al catálogo
          </a>
        </div>
      </div>
    </div>
  );
}
