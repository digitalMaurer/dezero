import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const temas = [
  { nombre: "Derechos de las personas en sus relaciones con la Administración Pública Foral. Derecho a la información. Tipos de información. Participación de la ciudadanía en la Administración. Quejas y sugerencias.", descripcion: "Parte I, Tema 1" },
  { nombre: "Principios de protección de datos y seguridad de la información. La comunicación oral y telefónica: normas, medios y confidencialidad; finalidad, uso y limitaciones. La comunicación escrita: normas, medios y clases. La carta: contenido, estructura y modelos.", descripcion: "Parte I, Tema 2" },
  { nombre: "Funcionamiento electrónico de la Administración Pública Foral. Obligaciones de la Administración Pública Foral en la tramitación electrónica.", descripcion: "Parte I, Tema 3" },
  { nombre: "Registros, archivo de la información y documentación. Sistemas de ordenación y clasificación documental. Conservación, acceso, seguridad y confidencialidad de la información y documentación. Los archivos: conceptos, tipos y normas prácticas de utilización. El control del archivo.", descripcion: "Parte I, Tema 4" },
  { nombre: "Documentación administrativa. El oficio, la instancia, el certificado, el acta, resoluciones administrativas, órdenes forales. El expediente administrativo. Validez de las copias realizadas por las administraciones públicas.", descripcion: "Parte I, Tema 5" },
  { nombre: "La Constitución Española de 1978: Principios generales. Derechos y deberes fundamentales. La Corona. Las Cortes Generales: composición y funciones. El Gobierno y la Administración del Estado. El Poder Judicial. El Tribunal Constitucional: Composición, naturaleza y competencias.", descripcion: "Parte II, Tema 1" },
  { nombre: "La Unión Europea: El Parlamento Europeo. El Consejo Europeo. El Consejo de la Unión Europea: competencias, estructura y funcionamiento. La Comisión Europea: composición, organización y funcionamiento. El Tribunal de Justicia. Las Fuentes del ordenamiento jurídico comunitario: el derecho originario y el derecho derivado.", descripcion: "Parte II, Tema 2" },
  { nombre: "La Ley Orgánica de Reintegración y Amejoramiento del Régimen Foral de Navarra: naturaleza y significado. El título Preliminar. Las competencias de Navarra.", descripcion: "Parte II, Tema 3" },
  { nombre: "El Parlamento o Cortes de Navarra: composición, organización y funciones. La Cámara de Comptos de Navarra: ámbito de competencia, funciones y órganos. El Defensor del Pueblo de la Comunidad Foral de Navarra: funciones, procedimiento y resoluciones.", descripcion: "Parte II, Tema 4" },
  { nombre: "El Gobierno de Navarra: Funciones. Composición, nombramiento, constitución y cese. Atribuciones y competencias. Funcionamiento. Órganos de asistencia y apoyo. Responsabilidad política, control parlamentario y disolución del Parlamento. La presidenta o presidente del Gobierno de Navarra. Las vicepresidentas o vicepresidentes y las consejeras o consejeros del Gobierno de Navarra.", descripcion: "Parte II, Tema 5" },
  { nombre: "Las Fuentes del Derecho: la jerarquía de las fuentes. La Ley. Las disposiciones del ejecutivo con rango de ley. La iniciativa legislativa y potestad para dictar normas con rango de ley. El reglamento: concepto, clases y límites. La potestad reglamentaria del Gobierno.", descripcion: "Parte II, Tema 6" },
  { nombre: "La Ley Foral 11/2019, de 11 de marzo, de la Administración de la Comunidad Foral de Navarra y del Sector Público Institucional Foral. Título I: \"Disposiciones Generales\". Título II: capítulo I \"Administración Pública Foral\". Capítulo II \"De la organización de la Administración Pública Foral\". Capítulo III \"Régimen jurídico del ejercicio de las competencias\". Capítulo IV \"Órganos colegiados\". Título III: capítulo I \"Organización de la Administración de la Comunidad Foral de Navarra\".", descripcion: "Parte II, Tema 7" },
  { nombre: "Los actos administrativos. Requisitos de los actos administrativos. Eficacia de los actos. Nulidad y anulabilidad. La revisión de los actos en vía administrativa: revisión de oficio y recursos administrativos.", descripcion: "Parte II, Tema 8" },
  { nombre: "Las disposiciones generales sobre el procedimiento administrativo: Los interesados en el procedimiento. De la actividad de las administraciones públicas: normas generales de actuación; términos y plazos. Garantías del procedimiento. Iniciación, ordenación, instrucción y finalización del procedimiento. Ejecución.", descripcion: "Parte II, Tema 9" },
  { nombre: "El Estatuto del Personal al servicio de las Administraciones Públicas de Navarra: Ámbito de aplicación, exclusiones y tipos de personal. Referencia al personal docente y sanitario de la Comunidad Foral de Navarra. Personal al servicio de la Administración de Justicia.", descripcion: "Parte II, Tema 10" },
  { nombre: "Personal en la Administración de la Comunidad Foral de Navarra I: Ingreso: convocatoria. Sistemas de selección. Órganos de selección. Procedimientos de selección. Niveles y grados. Carrera administrativa. Situaciones administrativas.", descripcion: "Parte II, Tema 11" },
  { nombre: "Personal en la Administración de la Comunidad Foral de Navarra II: Provisión de puestos de trabajo: Concurso de méritos. De libre designación. Provisión interina. Derechos y deberes. Retribuciones. Régimen disciplinario.", descripcion: "Parte II, Tema 12" },
  { nombre: "La Ley Orgánica 3/2007, de 22 de marzo, para la igualdad efectiva de hombres y mujeres: El principio de igualdad y la tutela contra la discriminación. La Ley Foral 17/2019, de 4 de abril, de igualdad entre mujeres y hombres.", descripcion: "Parte II, Tema 13" },
  { nombre: "La Ley Foral 5/2018, de 17 de mayo, de Transparencia, Acceso a la Información Pública y Buen Gobierno: Disposiciones Generales. La Transparencia: Transparencia en la actividad pública y Publicidad Activa. El derecho de acceso a la información pública: normas generales, procedimiento para su ejercicio y régimen de impugnaciones. El Consejo de Transparencia de Navarra.", descripcion: "Parte II, Tema 14" },
  { nombre: "La Hacienda Pública de Navarra. Régimen jurídico. Derechos y obligaciones. El control: la intervención y el control financiero. El régimen de responsabilidades.", descripcion: "Parte II, Tema 15" },
  { nombre: "Los Presupuestos Generales de Navarra. Principios generales. Contenido, elaboración y aprobación. Los créditos y sus modificaciones. Ejecución y liquidación de los Presupuestos.", descripcion: "Parte II, Tema 16" },
  { nombre: "Ley Foral 2/2018, de 13 de abril, de Contratos Públicos: título preliminar. Los contratistas. Tipología de contratos y régimen jurídico. Reglas de publicidad y procedimientos de adjudicación.", descripcion: "Parte II, Tema 17" },
  { nombre: "La Ley Foral 11/2005, de 9 de noviembre, de Subvenciones: Disposiciones generales y procedimiento de concesión y control. Reintegro de subvenciones.", descripcion: "Parte II, Tema 18" },
  { nombre: "Conceptos elementales sobre Windows 10. El escritorio y sus elementos; el Administrador de Tareas; el Explorador de archivos; el Panel de Control; Impresoras y escáneres; el botón de inicio; la barra de tareas; el comando Ejecutar; la Ayuda; trabajo en red; cuentas de usuario.", descripcion: "Parte III, Tema 1" },
  { nombre: "Procesadores de textos: conceptos fundamentales. Microsoft Word 2021: el área de trabajo; cintas de opciones; escribir y editar; formato de texto; diseño de página y configuración; estilos; plantillas; tablas; administración de archivos; combinar correspondencia; trabajar con campos; imprimir.", descripcion: "Parte III, Tema 2" },
  { nombre: "Hojas de cálculo: conceptos fundamentales. Microsoft Excel 2021: libros de trabajo; hojas; celdas; cintas de opciones; selección de celdas y comandos; introducción de datos; creación de fórmulas y vínculos; uso de funciones; diseño de página y configuración; edición de una hoja de cálculo; formatos; gráficos; imprimir.", descripcion: "Parte III, Tema 3" },
  { nombre: "Bases de datos: conceptos fundamentales. Microsoft Access 2021: fundamentos; tablas; consultas; formularios; informes; imprimir; cintas de opciones.", descripcion: "Parte III, Tema 4" }
];

async function importar() {
  console.log("🔍 Buscando oposición ADMINISTRATIVO...");
  
  const oposicion = await prisma.oposicion.findUnique({
    where: { codigo: 'ADMINISTRATIVO' }
  });
  
  if (!oposicion) {
    console.log("❌ No encontrada. Oposiciones disponibles:");
    const all = await prisma.oposicion.findMany();
    all.forEach(o => console.log(`  - ${o.nombre} (${o.codigo})`));
    process.exit(1);
  }
  
  console.log(`✅ Encontrada: ${oposicion.nombre}\n📥 Importando ${temas.length} temas...`);
  
  let created = 0, skipped = 0;
  
  for (const tema of temas) {
    const exists = await prisma.tema.findFirst({
      where: { nombre: tema.nombre, oposicionId: oposicion.id }
    });
    
    if (exists) {
      skipped++;
      console.log(`⏭️  ${skipped+created}. Saltado`);
    } else {
      await prisma.tema.create({
        data: { ...tema, oposicionId: oposicion.id }
      });
      created++;
      console.log(`✅ ${skipped+created}. Creado`);
    }
  }
  
  console.log(`\n✅ Importación completada:`);
  console.log(`   Creados: ${created}`);
  console.log(`   Saltados: ${skipped}`);
  console.log(`   Total: ${created + skipped}`);
  
  process.exit(0);
}

importar().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
