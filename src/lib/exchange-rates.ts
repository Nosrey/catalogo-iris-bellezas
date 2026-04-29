import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface ExchangeRates {
  dolarBCV: number;
  dolarParalelo: number;
}

export interface PriceCalculation {
  bs: number;
  usdAdjusted: number;
  usdInt: number;
  bsDecimals: number;
}

// Interface para suscriptores de tasas de cambio
export interface ExchangeRatesSubscriber {
  onExchangeRatesUpdate: (rates: ExchangeRates) => void;
  onError?: (error: Error) => void;
}

// Cache en memoria para tasas de cambio
let exchangeRatesCache: ExchangeRates = {
  dolarBCV: 0,
  dolarParalelo: 0
};
let exchangeRateListeners: (() => void)[] = [];
let exchangeRateSubscribers: Set<ExchangeRatesSubscriber> = new Set();

// Función para calcular precios adaptados
export const calculateAdaptedPrices = (priceUSD: number, bcvRate: number, paraleloRate: number): PriceCalculation => {
  const usd = Number(priceUSD);
  const bcv = Number(bcvRate);
  const par = Number(paraleloRate);

  // Calcular precio en bolívares exacto
  const precioBsExact = usd * par;
  
  // Redondear hacia arriba al múltiplo de 10 más cercano
  const bsRaw = Math.ceil(precioBsExact);
  const bsRounded10 = Math.ceil(bsRaw / 10) * 10;

  // Calcular USD ajustado basado en tasa BCV
  const usdAdjusted = precioBsExact / bcv;
  const usdInt = Math.floor(usdAdjusted);
  const bsDecimals = Math.ceil((usdAdjusted - usdInt) * bcv);

  return {
    bs: bsRounded10,
    usdAdjusted,
    usdInt,
    bsDecimals
  };
};

// Suscribirse a actualizaciones de tasas de cambio en tiempo real
export const subscribeToExchangeRates = (subscriber: ExchangeRatesSubscriber) => {
  exchangeRateSubscribers.add(subscriber);
  
  // Si ya hay cache, enviar datos inmediatamente
  if (exchangeRatesCache.dolarBCV > 0 && exchangeRatesCache.dolarParalelo > 0) {
    subscriber.onExchangeRatesUpdate(exchangeRatesCache);
  }
  
  // Si no hay listeners activos, crear uno nuevo
  if (exchangeRateListeners.length === 0) {
    const settingsRef = doc(db, 'settings', 'main');
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const rates: ExchangeRates = {
            dolarBCV: data.dolarBCV || 0,
            dolarParalelo: data.dolarParalelo || 0
          };
          
          exchangeRatesCache = rates;
          
          // Notificar a todos los suscriptores
          exchangeRateSubscribers.forEach(sub => {
            try {
              sub.onExchangeRatesUpdate(rates);
            } catch (error) {
              console.error('Error notifying exchange rates subscriber:', error);
              sub.onError?.(error as Error);
            }
          });
        }
      },
      (error) => {
        console.error('Error in exchange rates subscription:', error);
        exchangeRateSubscribers.forEach(sub => {
          sub.onError?.(error);
        });
      }
    );
    
    exchangeRateListeners.push(unsubscribe);
  }
  
  // Retornar función para unsuscribir
  return () => {
    exchangeRateSubscribers.delete(subscriber);
    
    // Si no hay más suscriptores, limpiar listeners
    if (exchangeRateSubscribers.size === 0) {
      exchangeRateListeners.forEach(unsubscribe => unsubscribe());
      exchangeRateListeners = [];
    }
  };
};

// Obtener tasas del cache
export const getCachedExchangeRates = (): ExchangeRates => {
  return exchangeRatesCache;
};

// Verificar si las tasas están disponibles
export const areExchangeRatesAvailable = (): boolean => {
  return exchangeRatesCache.dolarBCV > 0 && exchangeRatesCache.dolarParalelo > 0;
};

// Limpiar todos los listeners
export const cleanupExchangeRates = () => {
  exchangeRateListeners.forEach(unsubscribe => unsubscribe());
  exchangeRateListeners = [];
  exchangeRateSubscribers.clear();
  exchangeRatesCache = { dolarBCV: 0, dolarParalelo: 0 };
};
