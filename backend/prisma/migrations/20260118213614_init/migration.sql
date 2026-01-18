-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "oposiciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "oposicionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "temas_oposicionId_fkey" FOREIGN KEY ("oposicionId") REFERENCES "oposiciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opcionA" TEXT NOT NULL,
    "opcionB" TEXT NOT NULL,
    "opcionC" TEXT NOT NULL,
    "opcionD" TEXT,
    "respuestaCorrecta" TEXT NOT NULL,
    "explicacion" TEXT,
    "dificultad" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "temaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cantidadPreguntas" INTEGER NOT NULL,
    "tiempoLimite" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_questions_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "oposicionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "cantidadCorrectas" INTEGER NOT NULL,
    "cantidadIncorrectas" INTEGER NOT NULL,
    "tiempoInicio" DATETIME NOT NULL,
    "tiempoFin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_attempts_oposicionId_fkey" FOREIGN KEY ("oposicionId") REFERENCES "oposiciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attempt_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "respuestaUsuario" TEXT NOT NULL,
    "esCorrecta" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attempt_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preguntaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "question_reports_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_statistics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preguntaId" TEXT NOT NULL,
    "vecesRespondida" INTEGER NOT NULL DEFAULT 0,
    "vecesCorrecta" INTEGER NOT NULL DEFAULT 0,
    "porcentajeAcierto" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "question_statistics_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "thema_statistics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "temaId" TEXT NOT NULL,
    "preguntasTotal" INTEGER NOT NULL DEFAULT 0,
    "preguntasEstudiadas" INTEGER NOT NULL DEFAULT 0,
    "porcentajeEstudio" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "thema_statistics_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "oposiciones_codigo_key" ON "oposiciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "temas_oposicionId_nombre_key" ON "temas"("oposicionId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_testId_preguntaId_key" ON "test_questions"("testId", "preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_responses_attemptId_preguntaId_key" ON "attempt_responses"("attemptId", "preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "question_statistics_preguntaId_key" ON "question_statistics"("preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "thema_statistics_temaId_key" ON "thema_statistics"("temaId");
