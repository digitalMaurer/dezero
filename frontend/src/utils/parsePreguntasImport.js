export const parsePreguntasImportText = (text) => {
  const lines = text.trim().split('\n');
  const preguntas = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    const parts = line.split('|');
    if (parts.length !== 9) {
      throw new Error(`Línea ${index + 1}: Debe tener exactamente 9 campos separados por |`);
    }

    preguntas.push({
      id: parts[0].trim(),
      enunciado: parts[1].trim(),
      opcionA: parts[2].trim(),
      opcionB: parts[3].trim(),
      opcionC: parts[4].trim(),
      opcionD: parts[5].trim(),
      respuestacorrecta: parts[6].trim().toUpperCase(),
      explicacion: parts[7].trim() || '',
      tip: parts[8].trim() || '',
    });
  });

  return preguntas;
};
