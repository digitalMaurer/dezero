/**
 * Mezcla las opciones de una pregunta de forma determinista
 * La misma pregunta siempre genera el mismo shuffle
 * 
 * @param {Object} pregunta - { id, opcionA, opcionB, opcionC, opcionD, respuestaCorrecta }
 * @returns {Object} - { opcionA, opcionB, opcionC, opcionD, respuestaCorrecta } (mezcladas)
 */
export const shuffleQuestionOptions = (pregunta) => {
  if (!pregunta) return null;

  const options = [
    { letter: 'A', text: pregunta.opcionA },
    { letter: 'B', text: pregunta.opcionB },
    { letter: 'C', text: pregunta.opcionC },
  ];

  if (pregunta.opcionD) {
    options.push({ letter: 'D', text: pregunta.opcionD });
  }

  // Usar el ID de la pregunta como seed para mantener consistencia
  // La misma pregunta siempre tendrá el mismo shuffle
  const seed = pregunta.id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Algoritmo de Fisher-Yates con seed
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 7) % (i + 1); // Multiplico por 7 para más aleatoriedad con el seed
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Mapear de vuelta a las posiciones originales
  // shuffled[0] es ahora la primera opción que mostraremos (será A, B, C o D original)
  // Encontrar dónde fue la respuesta correcta original
  const originalCorrectIndex = options.findIndex(
    (opt) => opt.letter === pregunta.respuestaCorrecta
  );
  const newCorrectLetter = shuffled[originalCorrectIndex].letter;

  return {
    opcionA: shuffled[0].text,
    opcionB: shuffled[1].text,
    opcionC: shuffled[2].text,
    opcionD: shuffled[3]?.text || null,
    respuestaCorrecta: newCorrectLetter,
    // Devolver también el mapeo para debugging (opcional)
    _shuffleMap: shuffled.map((opt) => opt.letter),
  };
};
