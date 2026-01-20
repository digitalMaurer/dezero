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
  const seed = pregunta.id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Encontrar la opción correcta ANTES del shuffle
  const correctOption = options.find(
    (opt) => opt.letter === pregunta.respuestaCorrecta
  );

  if (!correctOption) {
    console.error('[shuffleUtils] Error: respuestaCorrecta no encontrada', {
      respuestaCorrecta: pregunta.respuestaCorrecta,
      options: options.map((o) => o.letter),
    });
    return {
      opcionA: pregunta.opcionA,
      opcionB: pregunta.opcionB,
      opcionC: pregunta.opcionC,
      opcionD: pregunta.opcionD || null,
      respuestaCorrecta: pregunta.respuestaCorrecta,
    };
  }

  // Algoritmo de Fisher-Yates con seed
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 7) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Encontrar en qué posición quedó la opción que era correcta
  // Buscamos el objeto correctOption en el array shuffled
  // El índice 0 = A, 1 = B, 2 = C, 3 = D
  const newCorrectIndex = shuffled.findIndex(
    (opt) => opt.letter === correctOption.letter
  );
  const newCorrectLetter = ['A', 'B', 'C', 'D'][newCorrectIndex];

  console.debug('[shuffleUtils] Shuffle mapping', {
    originalCorrect: correctOption.letter,
    newCorrect: newCorrectLetter,
    mapping: shuffled.map((opt) => opt.letter),
  });

  return {
    opcionA: shuffled[0].text,
    opcionB: shuffled[1].text,
    opcionC: shuffled[2].text,
    opcionD: shuffled[3]?.text || null,
    respuestaCorrecta: newCorrectLetter,
    _shuffleMap: shuffled.map((opt) => opt.letter),
  };
};
