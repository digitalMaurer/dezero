/**
 * Actualiza un intento en modo MANICOMIO dentro de una transacción.
 * Devuelve finished/puntaje calculados.
 */
export const updateManicomioAttempt = async ({
  tx,
  attemptId,
  streakCurrent,
  streakMax,
  cantidadCorrectas,
  cantidadIncorrectas,
  streakTarget,
  queue,
  queueCursor,
}) => {
  const finished = streakCurrent >= streakTarget;
  const totalRespondidas = cantidadCorrectas + cantidadIncorrectas;
  const puntaje = finished
    ? Math.round((cantidadCorrectas / (totalRespondidas || 1)) * 10)
    : undefined;

  await tx.testAttempt.update({
    where: { id: attemptId },
    data: {
      streakCurrent,
      streakMax,
      cantidadCorrectas,
      cantidadIncorrectas,
      ...(queue !== undefined
        ? { queue: Array.isArray(queue) ? JSON.stringify(queue) : queue }
        : {}),
      ...(queueCursor !== undefined ? { queueCursor } : {}),
      ...(finished && {
        puntaje,
        tiempoFin: new Date(),
      }),
    },
  });

  return { finished, puntaje };
};

/**
 * Actualiza un intento en modo ANKI secuencial dentro de una transacción.
 * Devuelve finished/puntaje calculados.
 */
export const updateAnkiAttempt = async ({
  tx,
  attemptId,
  cantidadCorrectas,
  cantidadIncorrectas,
  streakCurrent,
  streakMax,
  totalRespondidas,
  totalPreguntas,
}) => {
  const finished = totalRespondidas >= totalPreguntas;
  const puntaje = finished
    ? Math.round((cantidadCorrectas / (totalRespondidas || 1)) * 10)
    : undefined;

  await tx.testAttempt.update({
    where: { id: attemptId },
    data: {
      cantidadCorrectas,
      cantidadIncorrectas,
      streakCurrent,
      streakMax,
      ...(finished && {
        puntaje,
        tiempoFin: new Date(),
      }),
    },
  });

  return { finished, puntaje };
};
