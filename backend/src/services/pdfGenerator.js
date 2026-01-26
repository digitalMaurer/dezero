import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Genera un PDF de test con preguntas y plantilla de respuestas
 * @param {Object} test - Test con questions y oposicion
 * @param {Array} preguntas - Array de preguntas con opciones
 * @param {Object} options - Opciones de generación
 * @returns {PDFDocument} - Documento PDF stream
 */
export function generateTestPDF(test, preguntas, options = {}) {
  const { split = false, withAnswers = false } = options;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
  });

  // =========== PORTADA ===========
  doc.fontSize(24).text('Test de Oposición', { align: 'center' });
  doc.moveDown(0.5);

  if (test.oposicion) {
    doc.fontSize(18).text(test.oposicion.nombre, { align: 'center' });
  }

  doc.moveDown(1);
  doc.fontSize(12).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  doc.fontSize(12).text(`Preguntas: ${preguntas.length}`, { align: 'center' });
  doc.moveDown(0.5);

  // Temas incluidos
  const temasSet = new Set();
  preguntas.forEach((p) => {
    if (p.tema?.nombre) temasSet.add(p.tema.nombre);
  });
  const temasList = Array.from(temasSet);
  if (temasList.length > 0) {
    doc.fontSize(11).text('Temas:', { underline: true });
    temasList.forEach((tema) => {
      doc.fontSize(10).text(`• ${tema}`);
    });
  }

  // =========== PREGUNTAS ===========
  preguntas.forEach((pregunta, index) => {
    doc.addPage();

    // Header con número y tema
    doc.fontSize(10).fillColor('#666')
      .text(`Pregunta ${index + 1}`, 50, 50);
    
    if (pregunta.tema?.nombre) {
      doc.fontSize(10).fillColor('#0066cc')
        .text(`📚 Tema: ${pregunta.tema.nombre}`, 300, 50, { width: 250, align: 'right' });
    }

    // Línea separadora
    doc.moveTo(50, 70).lineTo(545, 70).stroke('#cccccc');

    doc.moveDown(2);

    // Enunciado
    doc.fontSize(12).fillColor('#000')
      .text(pregunta.enunciado || 'Sin enunciado', {
        align: 'left',
        width: 495,
      });

    doc.moveDown(1);

    // Opciones
    const opciones = [
      { letra: 'A', texto: pregunta.opcionA },
      { letra: 'B', texto: pregunta.opcionB },
      { letra: 'C', texto: pregunta.opcionC },
      { letra: 'D', texto: pregunta.opcionD },
    ];

    opciones.forEach((opcion) => {
      if (!opcion.texto) return;

      const y = doc.y;
      
      // Checkbox vacío (o marcado si withAnswers y es correcta)
      const isCorrect = withAnswers && pregunta.respuestaCorrecta === opcion.letra;
      const checkbox = isCorrect ? '☑' : '☐';
      
      doc.fontSize(11).fillColor(isCorrect ? '#00cc00' : '#000')
        .text(`${opcion.letra}) ${checkbox}`, 50, y, { continued: true, width: 30 });
      
      doc.fontSize(11).fillColor('#000')
        .text(` ${opcion.texto}`, { width: 465 });

      doc.moveDown(0.3);
    });

    // Imagen si existe
    if (pregunta.imageUrl) {
      const imagePath = path.join(process.cwd(), pregunta.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          doc.moveDown(1);
          doc.image(imagePath, {
            fit: [400, 200],
            align: 'center',
          });
        } catch (err) {
          console.error(`Error cargando imagen ${imagePath}:`, err);
        }
      }
    }

    // Tip si existe y withAnswers
    if (withAnswers && pregunta.tip) {
      doc.moveDown(1);
      doc.fontSize(10).fillColor('#ff9800')
        .text(`💡 Consejo: ${pregunta.tip}`, { width: 495 });
    }

    // Explicación si existe y withAnswers
    if (withAnswers && pregunta.explicacion) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#0066cc')
        .text(`📖 Explicación: ${pregunta.explicacion}`, { width: 495 });
    }
  });

  // =========== PLANTILLA DE RESPUESTAS ===========
  if (!split) {
    doc.addPage();
    
    doc.fontSize(16).fillColor('#000')
      .text('PLANTILLA DE RESPUESTAS', { align: 'center', underline: true });

    doc.moveDown(1);

    // Generar tabla con 2 columnas
    const cellWidth = 80;
    const cellHeight = 20;
    const startX = 50;
    let startY = doc.y;
    const colGap = 40;

    // Dividir preguntas en 2 columnas
    const col1 = preguntas.filter((_, i) => i % 2 === 0);
    const col2 = preguntas.filter((_, i) => i % 2 === 1);

    const maxRows = Math.max(col1.length, col2.length);

    // Header
    doc.fontSize(10).fillColor('#000').text('#', startX, startY, { width: 20 });
    doc.text('A', startX + 25, startY, { width: 15 });
    doc.text('B', startX + 45, startY, { width: 15 });
    doc.text('C', startX + 65, startY, { width: 15 });
    doc.text('D', startX + 85, startY, { width: 15 });

    const col2X = startX + cellWidth + colGap + 40;
    doc.text('#', col2X, startY, { width: 20 });
    doc.text('A', col2X + 25, startY, { width: 15 });
    doc.text('B', col2X + 45, startY, { width: 15 });
    doc.text('C', col2X + 65, startY, { width: 15 });
    doc.text('D', col2X + 85, startY, { width: 15 });

    startY += cellHeight;

    // Filas
    for (let i = 0; i < maxRows; i++) {
      const y = startY + i * cellHeight;

      // Columna 1
      if (i < col1.length) {
        const num = i * 2 + 1;
        doc.fontSize(9).text(num.toString(), startX, y, { width: 20 });
        doc.rect(startX + 25, y, 15, 15).stroke();
        doc.rect(startX + 45, y, 15, 15).stroke();
        doc.rect(startX + 65, y, 15, 15).stroke();
        doc.rect(startX + 85, y, 15, 15).stroke();
      }

      // Columna 2
      if (i < col2.length) {
        const num = i * 2 + 2;
        doc.fontSize(9).text(num.toString(), col2X, y, { width: 20 });
        doc.rect(col2X + 25, y, 15, 15).stroke();
        doc.rect(col2X + 45, y, 15, 15).stroke();
        doc.rect(col2X + 65, y, 15, 15).stroke();
        doc.rect(col2X + 85, y, 15, 15).stroke();
      }

      // Evitar overflow de página
      if (y > 700 && i < maxRows - 1) {
        doc.addPage();
        startY = 100;
      }
    }
  }

  // Finalizar documento
  doc.end();

  return doc;
}
