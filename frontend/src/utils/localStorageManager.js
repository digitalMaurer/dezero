/**
 * Utilidad para gestionar el localStorage de forma segura
 * Previene errores de QuotaExceeded limpiando datos antiguos
 * 
 * PROBLEMA RESUELTO:
 * - localStorage tiene un límite de ~5-10MB
 * - Guardar datos de tests en cada intento acumula datos
 * - Al exceder la cuota, se lanza QuotaExceededError
 * 
 * SOLUCIÓN:
 * - Limpieza automática de tests antiguos (mantiene últimos 10)
 * - safeSetItem() maneja errores de cuota automáticamente
 * - Limpieza en cascada si persiste el error
 * 
 * USO:
 * ```js
 * import { safeSetItem, cleanOldTestData } from '../utils/localStorageManager';
 * 
 * // Limpiar antes de operaciones grandes
 * cleanOldTestData();
 * 
 * // Guardar con manejo automático de errores
 * safeSetItem('test_123', JSON.stringify(data));
 * ```
 */

const TEST_DATA_PREFIX = 'test_';
const TEST_ANSWERS_PREFIX = 'test_answers_';
const MAX_TEST_ENTRIES = 10; // Mantener solo los últimos 10 tests

/**
 * Obtiene todas las claves de localStorage relacionadas con tests
 */
const getTestKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(TEST_DATA_PREFIX) || key.startsWith(TEST_ANSWERS_PREFIX))) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Limpia los datos de tests más antiguos del localStorage
 * Mantiene solo los últimos MAX_TEST_ENTRIES
 */
export const cleanOldTestData = () => {
  try {
    const testKeys = getTestKeys();
    
    // Si no hay muchas entradas, no hacer nada
    if (testKeys.length <= MAX_TEST_ENTRIES) {
      return;
    }

    // Crear un mapa de timestamps para ordenar por antigüedad
    const keysWithTime = testKeys.map(key => {
      try {
        const data = localStorage.getItem(key);
        const parsed = JSON.parse(data);
        // Usar createdAt o timestamp si existe, si no usar 0
        const timestamp = parsed?.createdAt || parsed?.timestamp || 0;
        return { key, timestamp: new Date(timestamp).getTime() || 0 };
      } catch {
        // Si falla el parse, asumir que es muy antiguo
        return { key, timestamp: 0 };
      }
    });

    // Ordenar por timestamp (más antiguos primero)
    keysWithTime.sort((a, b) => a.timestamp - b.timestamp);

    // Eliminar los más antiguos, dejando solo MAX_TEST_ENTRIES
    const toRemove = keysWithTime.slice(0, keysWithTime.length - MAX_TEST_ENTRIES);
    
    toRemove.forEach(({ key }) => {
      localStorage.removeItem(key);
      console.debug(`[LocalStorage] Eliminado: ${key}`);
    });

    if (toRemove.length > 0) {
      console.log(`[LocalStorage] Limpiados ${toRemove.length} tests antiguos`);
    }
  } catch (error) {
    console.error('[LocalStorage] Error limpiando datos antiguos:', error);
  }
};

/**
 * Guarda datos en localStorage de forma segura
 * Intenta limpiar datos antiguos si falla por QuotaExceeded
 */
export const safeSetItem = (key, value) => {
  try {
    // Intentar guardar directamente
    localStorage.setItem(key, value);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('[LocalStorage] Cuota excedida, limpiando datos antiguos...');
      
      // Limpiar datos antiguos
      cleanOldTestData();
      
      try {
        // Intentar de nuevo después de limpiar
        localStorage.setItem(key, value);
        console.log('[LocalStorage] Guardado exitoso después de limpieza');
      } catch (retryError) {
        console.error('[LocalStorage] Error persistente después de limpieza:', retryError);
        
        // Si aún falla, intentar limpieza más agresiva
        const testKeys = getTestKeys();
        testKeys.forEach(k => localStorage.removeItem(k));
        
        // Último intento
        try {
          localStorage.setItem(key, value);
          console.warn('[LocalStorage] Guardado después de limpieza completa');
        } catch (finalError) {
          console.error('[LocalStorage] No se pudo guardar incluso después de limpieza completa');
          throw finalError;
        }
      }
    } else {
      throw error;
    }
  }
};

/**
 * Limpia todos los datos de tests del localStorage
 * Útil para debugging o reset manual
 */
export const clearAllTestData = () => {
  const testKeys = getTestKeys();
  testKeys.forEach(key => localStorage.removeItem(key));
  console.log(`[LocalStorage] Eliminados ${testKeys.length} tests del localStorage`);
  return testKeys.length;
};

/**
 * Obtiene información sobre el uso del localStorage
 */
export const getStorageInfo = () => {
  const testKeys = getTestKeys();
  let totalSize = 0;
  
  testKeys.forEach(key => {
    const value = localStorage.getItem(key);
    totalSize += key.length + (value?.length || 0);
  });

  return {
    testCount: testKeys.length,
    estimatedSize: `${(totalSize / 1024).toFixed(2)} KB`,
    keys: testKeys,
  };
};
