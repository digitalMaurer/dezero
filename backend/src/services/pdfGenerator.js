import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Genera un PDF de test profesional y limpio
 * @param {Object} test - Test con questions y oposicion
 * @param {Array} preguntas - Array de preguntas con opciones
 * @param {Object} options - Opciones de generación
 * @returns {PDFDocument} - Documento PDF stream
 */
export function generateTestPDF(test, preguntas, options = {}) {
  const { withAnswers = false } = options;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  const PAGE_WIDTH = 595 - 80; // A4 width - margins
  const MARGIN_LEFT = 40;

  // =========== PÁGINA 1: PORTADA ===========
  addCover(doc, test, preguntas, PAGE_WIDTH);

  // =========== PÁGINAS SIGUIENTES: PREGUNTAS ===========
  preguntas.forEach((pregunta, index) => {
    doc.addPage();
    addPregunta(doc, pregunta, index + 1, PAGE_WIDTH, MARGIN_LEFT, withAnswers);
  });

  // =========== ÚLTIMA PÁGINA: PLANTILLA DE RESPUESTAS ===========
  doc.addPage();
  addPlantillaRespuestas(doc, preguntas.length, PAGE_WIDTH, MARGIN_LEFT);

  doc.end();
  return doc;
}

/**
 * Añade página de portada
 */
function addCover(doc, test, preguntas, pageWidth) {
  doc.moveDown(3);

  // Título
  doc.fontSize(28).font('Helvetica-Bold')
    .text('TEST DE OPOSICIÓN', { align: 'center' });

  doc.moveDown(1.5);

  // Oposición
  if (test.oposicion?.nombre) {
    doc.fontSize(18).font('Helvetica')
      .text(test.oposicion.nombre, { align: 'center' });
  }

  doc.moveDown(2);

  // Datos
  doc.fontSize(11).font('Helvetica')
    .text(`Número de preguntas: ${preguntas.length}`, { align: 'center' })
    .moveDown(0.3)
    .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });

  doc.moveDown(2);

  // Temas
  const temasSet = new Set();
  preguntas.forEach((p) => {
    if (p.tema?.nombre) temasSet.add(p.tema.nombre);
  });

  if (temasSet.size > 0) {
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Temas incluidos:', { align: 'center' });
    doc.moveDown(0.5);

    const temasList = Array.from(temasSet).sort();
    doc.fontSize(10).font('Helvetica');
    
    let temasText = temasList.join(' • ');
    doc.text(temasText, { align: 'center', width: pageWidth });
  }

  doc.moveDown(3);

  // Instrucciones
  doc.fontSize(10).font('Helvetica-Bold')
    .text('Instrucciones:', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica')
    .text('Marca la opción correcta para cada pregunta', { align: 'center' })
    .moveDown(0.2)
    .text('Una única respuesta es correcta en cada caso', { align: 'center' });
}

/**
 * Añade una pregunta a la página
 */
function addPregunta(doc, pregunta, numero, pageWidth, marginLeft, withAnswers) {
  // Resetear posición si es inválida
  if (!doc.y || isNaN(doc.y)) {
    doc.y = 100;
  }

  // Número de pregunta
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
    .text(`${numero})`, marginLeft, doc.y);

  doc.moveDown(0.2);

  // Enunciado
  doc.fontSize(11).font('Helvetica').fillColor('#000000')
    .text(pregunta.enunciado || 'Sin enunciado', marginLeft, doc.y, {
      width: pageWidth,
      align: 'left',
    });

  doc.moveDown(0.8);

  // Opciones
  const opciones = [
    { letra: 'A', texto: pregunta.opcionA },
    { letra: 'B', texto: pregunta.opcionB },
    { letra: 'C', texto: pregunta.opcionC },
    { letra: 'D', texto: pregunta.opcionD },
  ];

  opciones.forEach((opcion) => {
    if (!opcion.texto) return;

    const isCorrect = withAnswers && pregunta.respuestaCorrecta === opcion.letra;
    const checkbox = isCorrect ? '✓' : '☐';
    const color = isCorrect ? '#00aa00' : '#000000';

    const currentY = doc.y || 100;

    doc.fontSize(10).font('Helvetica')
      .fillColor(color)
      .text(`${opcion.letra}) ${checkbox}  ${opcion.texto}`, marginLeft, currentY, {
        width: pageWidth - 20,
      });

    doc.moveDown(0.4);
  });

  // Imagen si existe
  if (pregunta.imageUrl) {
    const imagePath = path.join(process.cwd(), pregunta.imageUrl);
    if (fs.existsSync(imagePath)) {
      try {
        doc.moveDown(0.5);
        const imgY = doc.y || 100;
        doc.image(imagePath, marginLeft, imgY, {
          fit: [pageWidth, 150],
          align: 'center',
        });
        doc.moveDown(5); // Espacio después de la imagen
      } catch (err) {
        console.error(`Error cargando imagen ${imagePath}:`, err);
      }
    }
  }

  // Tema en footer
  if (pregunta.tema?.nombre) {
    doc.moveDown(1);
    const temaY = doc.y || 100;
    doc.fontSize(8).font('Helvetica').fillColor('#999999')
      .text(`Tema: ${pregunta.tema.nombre}`, marginLeft, temaY);
  }

  // Separador
  doc.moveDown(1);
  const lineY = doc.y || 100;
  doc.strokeColor('#e0e0e0').lineWidth(0.5)
    .moveTo(marginLeft, lineY)
    .lineTo(marginLeft + pageWidth, lineY)
    .stroke();

  doc.moveDown(0.5);

  // Salto de página si se acerca al final
  if (doc.y > 700) {
    doc.addPage();
  }
}

/**
 * Añade plantilla de respuestas al final
 */
function addPlantillaRespuestas(doc, totalPreguntas, pageWidth, marginLeft) {
  // Resetear posición al inicio de la página
  doc.y = 100;

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
    .text('PLANTILLA DE RESPUESTAS', marginLeft, doc.y, { align: 'center', width: pageWidth });

  doc.moveDown(1.5);

  // Tabla con 2 columnas
  const rowHeight = 18;
  const col1X = marginLeft;
  const col2X = marginLeft + pageWidth / 2 + 20;

  // Header
  let currentY = doc.y || 150;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');

  // Columna 1
  doc.text('#', col1X, currentY, { width: 20 });
  doc.text('A', col1X + 25, currentY, { width: 15 });
  doc.text('B', col1X + 45, currentY, { width: 15 });
  doc.text('C', col1X + 65, currentY, { width: 15 });
  doc.text('D', col1X + 85, currentY, { width: 15 });

  // Columna 2
  doc.text('#', col2X, currentY, { width: 20 });
  doc.text('A', col2X + 25, currentY, { width: 15 });
  doc.text('B', col2X + 45, currentY, { width: 15 });
  doc.text('C', col2X + 65, currentY, { width: 15 });
  doc.text('D', col2X + 85, currentY, { width: 15 });

  currentY += 20;

  // Línea separadora del header
  doc.strokeColor('#cccccc').lineWidth(1)
    .moveTo(col1X, currentY)
    .lineTo(marginLeft + pageWidth, currentY)
    .stroke();

  currentY += 10;

  // Filas
  const numPerCol = Math.ceil(totalPreguntas / 2);

  for (let i = 0; i < numPerCol; i++) {
    // Columna 1
    if (i < totalPreguntas) {
      const num1 = i + 1;
      doc.fontSize(9).fillColor('#000000')
        .text(num1.toString(), col1X, currentY, { width: 20 });

      // Cuadrículas
      for (let j = 0; j < 4; j++) {
        const boxX = col1X + 25 + j * 20;
        doc.rect(boxX, currentY, 12, 12).stroke();
      }
    }

    // Columna 2
    if (i + numPerCol < totalPreguntas) {
      const num2 = i + numPerCol + 1;
      doc.fontSize(9).fillColor('#000000')
        .text(num2.toString(), col2X, currentY, { width: 20 });

      // Cuadrículas
      for (let j = 0; j < 4; j++) {
        const boxX = col2X + 25 + j * 20;
        doc.rect(boxX, currentY, 12, 12).stroke();
      }
    }

    currentY += rowHeight;
  }
}
