import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/jwt.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes
  await prisma.attemptResponse.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.test.deleteMany();
  await prisma.questionStatistic.deleteMany();
  await prisma.themaStatistic.deleteMany();
  await prisma.questionReport.deleteMany();
  await prisma.pregunta.deleteMany();
  await prisma.tema.deleteMany();
  await prisma.oposicion.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Datos antiguos eliminados');

  // Crear usuarios
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      username: 'admin',
      password: adminPassword,
      nombre: 'Admin',
      apellidos: 'Sistema',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      username: 'estudiante',
      password: userPassword,
      nombre: 'Juan',
      apellidos: 'Pérez García',
      role: 'STUDENT',
    },
  });

  console.log('✓ Usuarios creados');

  // Crear oposiciones
  const policia = await prisma.oposicion.create({
    data: {
      nombre: 'Policía Nacional',
      codigo: 'CNP',
      descripcion: 'Cuerpo Nacional de Policía - Escala Básica',
    },
  });

  const guardiaCivil = await prisma.oposicion.create({
    data: {
      nombre: 'Guardia Civil',
      codigo: 'GC',
      descripcion: 'Guardia Civil - Escala de Cabos y Guardias',
    },
  });

  console.log('✓ Oposiciones creadas');

  // Crear temas para Policía Nacional
  const temaConstitucion = await prisma.tema.create({
    data: {
      nombre: 'Constitución Española',
      descripcion: 'Conocimientos sobre la Constitución Española de 1978',
      oposicionId: policia.id,
    },
  });

  const temaDerecho = await prisma.tema.create({
    data: {
      nombre: 'Derecho Penal',
      descripcion: 'Nociones básicas de Derecho Penal',
      oposicionId: policia.id,
    },
  });

  const temaOrganizacion = await prisma.tema.create({
    data: {
      nombre: 'Organización Policial',
      descripcion: 'Estructura y organización de las Fuerzas y Cuerpos de Seguridad',
      oposicionId: policia.id,
    },
  });

  // Crear temas para Guardia Civil
  const temaConstitucionGC = await prisma.tema.create({
    data: {
      nombre: 'Constitución Española',
      descripcion: 'Principios constitucionales básicos',
      oposicionId: guardiaCivil.id,
    },
  });

  console.log('✓ Temas creados');

  // Crear preguntas para Constitución Española (Policía)
  const preguntasConstitucion = [
    {
      titulo: 'Artículo 1 CE',
      enunciado: '¿Qué valores superiores propugna la Constitución Española?',
      opcionA: 'Libertad, justicia, igualdad y pluralismo político',
      opcionB: 'Libertad, fraternidad, igualdad y solidaridad',
      opcionC: 'Justicia, democracia, soberanía y libertad',
      opcionD: 'Igualdad, justicia, paz y orden',
      respuestaCorrecta: 'A',
      explicacion: 'El artículo 1.1 de la CE establece como valores superiores del ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaConstitucion.id,
    },
    {
      titulo: 'Forma política del Estado',
      enunciado: '¿Qué forma política tiene el Estado español según la Constitución?',
      opcionA: 'República parlamentaria',
      opcionB: 'Monarquía parlamentaria',
      opcionC: 'Monarquía absoluta',
      opcionD: 'República federal',
      respuestaCorrecta: 'B',
      explicacion: 'El artículo 1.3 establece que la forma política del Estado español es la Monarquía parlamentaria.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaConstitucion.id,
    },
    {
      titulo: 'Soberanía nacional',
      enunciado: '¿En quién reside la soberanía nacional según la Constitución?',
      opcionA: 'En el Rey',
      opcionB: 'En el Gobierno',
      opcionC: 'En el pueblo español',
      opcionD: 'En las Cortes Generales',
      respuestaCorrecta: 'C',
      explicacion: 'El artículo 1.2 establece que la soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaConstitucion.id,
    },
    {
      titulo: 'Mayoría de edad',
      enunciado: '¿Con qué edad se alcanza la mayoría de edad según la Constitución?',
      opcionA: '16 años',
      opcionB: '17 años',
      opcionC: '18 años',
      opcionD: '21 años',
      respuestaCorrecta: 'C',
      explicacion: 'El artículo 12 establece que los españoles son mayores de edad a los dieciocho años.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaConstitucion.id,
    },
    {
      titulo: 'Derecho a la vida',
      enunciado: '¿Qué artículo de la Constitución reconoce el derecho a la vida?',
      opcionA: 'Artículo 14',
      opcionB: 'Artículo 15',
      opcionC: 'Artículo 16',
      opcionD: 'Artículo 17',
      respuestaCorrecta: 'B',
      explicacion: 'El artículo 15 reconoce el derecho a la vida y a la integridad física y moral, sin que nadie pueda ser sometido a tortura ni a penas o tratos inhumanos o degradantes.',
      dificultad: 'MEDIUM',
      status: 'PUBLISHED',
      temaId: temaConstitucion.id,
    },
  ];

  // Crear preguntas para Derecho Penal
  const preguntasDerecho = [
    {
      titulo: 'Edad penal',
      enunciado: '¿A partir de qué edad se tiene responsabilidad penal en España?',
      opcionA: '14 años',
      opcionB: '16 años',
      opcionC: '18 años',
      opcionD: '21 años',
      respuestaCorrecta: 'C',
      explicacion: 'Según el Código Penal español, la responsabilidad penal se adquiere a los 18 años.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaDerecho.id,
    },
    {
      titulo: 'Tipos de penas',
      enunciado: '¿Cuál de las siguientes NO es una pena según el Código Penal?',
      opcionA: 'Prisión',
      opcionB: 'Multa',
      opcionC: 'Trabajos forzados',
      opcionD: 'Inhabilitación',
      respuestaCorrecta: 'C',
      explicacion: 'Los trabajos forzados están prohibidos por la Constitución. Las penas permitidas son prisión, multa, inhabilitación, entre otras.',
      dificultad: 'MEDIUM',
      status: 'PUBLISHED',
      temaId: temaDerecho.id,
    },
    {
      titulo: 'Legítima defensa',
      enunciado: '¿Cuál es un requisito de la legítima defensa?',
      opcionA: 'Agresión ilegítima',
      opcionB: 'Provocación previa',
      opcionC: 'Venganza justificada',
      opcionD: 'Odio hacia el agresor',
      respuestaCorrecta: 'A',
      explicacion: 'La legítima defensa requiere una agresión ilegítima, necesidad racional del medio empleado y falta de provocación suficiente.',
      dificultad: 'HARD',
      status: 'PUBLISHED',
      temaId: temaDerecho.id,
    },
  ];

  // Crear preguntas para Organización Policial
  const preguntasOrganizacion = [
    {
      titulo: 'Dependencia CNP',
      enunciado: '¿De qué ministerio depende el Cuerpo Nacional de Policía?',
      opcionA: 'Ministerio de Defensa',
      opcionB: 'Ministerio del Interior',
      opcionC: 'Ministerio de Justicia',
      opcionD: 'Ministerio de la Presidencia',
      respuestaCorrecta: 'B',
      explicacion: 'El Cuerpo Nacional de Policía depende del Ministerio del Interior.',
      dificultad: 'EASY',
      status: 'PUBLISHED',
      temaId: temaOrganizacion.id,
    },
    {
      titulo: 'Escalas CNP',
      enunciado: '¿Cuántas escalas tiene el Cuerpo Nacional de Policía?',
      opcionA: '2 escalas',
      opcionB: '3 escalas',
      opcionC: '4 escalas',
      opcionD: '5 escalas',
      respuestaCorrecta: 'C',
      explicacion: 'El CNP tiene 4 escalas: Comisario Principal, Comisario, Subinspección e Inspección, y Escala Básica.',
      dificultad: 'MEDIUM',
      status: 'PUBLISHED',
      temaId: temaOrganizacion.id,
    },
  ];

  // Insertar todas las preguntas
  await prisma.pregunta.createMany({
    data: [...preguntasConstitucion, ...preguntasDerecho, ...preguntasOrganizacion],
  });

  console.log('✓ Preguntas creadas');

  console.log('');
  console.log('========================================');
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
  console.log('========================================');
  console.log('');
  console.log('📊 RESUMEN:');
  console.log(`   - 2 Usuarios creados`);
  console.log(`   - 2 Oposiciones creadas`);
  console.log(`   - 4 Temas creados`);
  console.log(`   - 10 Preguntas creadas`);
  console.log('');
  console.log('👤 CREDENCIALES DE PRUEBA:');
  console.log('');
  console.log('   Admin:');
  console.log('   Email: admin@test.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('   Estudiante:');
  console.log('   Email: user@test.com');
  console.log('   Password: user123');
  console.log('');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
