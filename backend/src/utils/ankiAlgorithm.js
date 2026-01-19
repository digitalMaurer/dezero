/**
 * Algoritmo de repetición espaciada basado en SM-2 (SuperMemo 2)
 * Adaptado para sistema de oposiciones
 */

/**
 * Calcula los nuevos valores Anki según la calidad de la respuesta
 * @param {Object} currentState - Estado actual de la pregunta
 * @param {number} currentState.easeFactor - Factor de facilidad actual
 * @param {number} currentState.interval - Intervalo actual en días
 * @param {number} currentState.repetitions - Número de repeticiones
 * @param {number} quality - Calidad de la respuesta (0=Otra vez, 1=Difícil, 2=Bien, 3=Fácil)
 * @returns {Object} Nuevo estado Anki
 */
function calculateAnkiUpdate(currentState, quality) {
  let { easeFactor, interval, repetitions } = currentState;

  // Si la calidad es 0 (Otra vez), resetear
  if (quality === 0) {
    return {
      easeFactor: Math.max(1.3, easeFactor - 0.2), // Reducir factor pero no menos de 1.3
      interval: 1, // Volver a revisar mañana
      repetitions: 0,
      dueDate: addDays(new Date(), 1),
      lastReview: new Date()
    };
  }

  // Actualizar factor de facilidad
  easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  
  // No permitir que el factor sea menor a 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calcular nuevo intervalo
  repetitions += 1;
  
  if (repetitions === 1) {
    interval = 1; // Primera repetición: 1 día
  } else if (repetitions === 2) {
    interval = 6; // Segunda repetición: 6 días
  } else {
    interval = Math.round(interval * easeFactor);
  }

  // Modificar intervalo según calidad
  if (quality === 1) { // Difícil
    interval = Math.round(interval * 0.5); // 50% del intervalo calculado
  } else if (quality === 3) { // Fácil
    interval = Math.round(interval * 1.3); // 130% del intervalo calculado
  }

  // Asegurar intervalo mínimo de 1 día
  if (interval < 1) {
    interval = 1;
  }

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // 2 decimales
    interval,
    repetitions,
    dueDate: addDays(new Date(), interval),
    lastReview: new Date()
  };
}

/**
 * Obtiene el siguiente estado Anki para una pregunta contestada incorrectamente
 * Siempre va a "Otra vez" (calidad 0)
 */
function getAnkiStateForWrongAnswer(currentState) {
  return calculateAnkiUpdate(currentState, 0);
}

/**
 * Obtiene el siguiente estado Anki según la calificación del usuario
 * @param {Object} currentState - Estado actual
 * @param {string} grade - "OTRA_VEZ" | "DIFICIL" | "BIEN" | "FACIL"
 */
function getAnkiStateForGrade(currentState, grade) {
  const gradeMap = {
    'OTRA_VEZ': 0,
    'DIFICIL': 1,
    'BIEN': 2,
    'FACIL': 3
  };
  
  const quality = gradeMap[grade] || 0;
  return calculateAnkiUpdate(currentState, quality);
}

/**
 * Agrega días a una fecha
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Obtiene preguntas que necesitan revisión (vencidas)
 * @param {Array} preguntas - Lista de preguntas
 * @returns {Array} Preguntas vencidas o nunca revisadas
 */
function getDueQuestions(preguntas) {
  const now = new Date();
  
  return preguntas.filter(pregunta => {
    // Si nunca se ha revisado, incluirla
    if (!pregunta.dueDate) {
      return true;
    }
    
    // Si la fecha de revisión es hoy o pasada
    return new Date(pregunta.dueDate) <= now;
  });
}

/**
 * Obtiene estadísticas de revisión
 */
function getReviewStats(preguntas) {
  const now = new Date();
  const stats = {
    total: preguntas.length,
    nuncaRevisadas: 0,
    vencidas: 0,
    hoy: 0,
    proximos7dias: 0,
    masAdelante: 0
  };

  preguntas.forEach(pregunta => {
    if (!pregunta.dueDate) {
      stats.nuncaRevisadas++;
      return;
    }

    const dueDate = new Date(pregunta.dueDate);
    const diffDays = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      stats.vencidas++;
    } else if (diffDays === 0) {
      stats.hoy++;
    } else if (diffDays <= 7) {
      stats.proximos7dias++;
    } else {
      stats.masAdelante++;
    }
  });

  return stats;
}

export {
  calculateAnkiUpdate,
  getAnkiStateForWrongAnswer,
  getAnkiStateForGrade,
  getDueQuestions,
  getReviewStats,
  addDays
};
