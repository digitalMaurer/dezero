import { shuffleQuestionOptions } from '../utils/shuffleUtils.js';

/**
 * Procesa una respuesta de intento (secuencial / manicomio) y devuelve métricas comunes.
 * No realiza escrituras en BD; solo calcula en memoria.
 */
export const processAnswer = ({ attempt, pregunta, respuestaUsuario, existingResponse }) => {
  if (!attempt || !pregunta || !respuestaUsuario) {
    throw new Error('Datos insuficientes para procesar la respuesta');
  }

  // Recalcular el shuffle con seed estable para remapear la respuesta correcta
  const shuffled = shuffleQuestionOptions(pregunta);
  const respuestaCorrectaRemapeada = shuffled.respuestaCorrecta;
  const esCorrecta = respuestaCorrectaRemapeada === respuestaUsuario;

  // Si ya había una respuesta previa, restar su efecto antes de sumar la nueva
  const baseCorrectas = existingResponse
    ? Math.max(0, attempt.cantidadCorrectas - (existingResponse.esCorrecta ? 1 : 0))
    : attempt.cantidadCorrectas;
  const baseIncorrectas = existingResponse
    ? Math.max(0, attempt.cantidadIncorrectas - (existingResponse.esCorrecta ? 0 : 1))
    : attempt.cantidadIncorrectas;

  const opciones = [shuffled.opcionA, shuffled.opcionB, shuffled.opcionC, shuffled.opcionD];
  const textoRespuestaUsuario = opciones[respuestaUsuario.charCodeAt(0) - 65];
  const textoRespuestaCorrecta = opciones[respuestaCorrectaRemapeada.charCodeAt(0) - 65];

  return {
    esCorrecta,
    respuestaCorrectaRemapeada,
    textoRespuestaUsuario,
    textoRespuestaCorrecta,
    baseCorrectas,
    baseIncorrectas,
  };
};
