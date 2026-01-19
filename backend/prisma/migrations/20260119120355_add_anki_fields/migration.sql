-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_preguntas" (
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
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lastReview" DATETIME,
    "temaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_preguntas" ("createdAt", "dificultad", "enunciado", "explicacion", "id", "opcionA", "opcionB", "opcionC", "opcionD", "respuestaCorrecta", "status", "temaId", "titulo", "updatedAt") SELECT "createdAt", "dificultad", "enunciado", "explicacion", "id", "opcionA", "opcionB", "opcionC", "opcionD", "respuestaCorrecta", "status", "temaId", "titulo", "updatedAt" FROM "preguntas";
DROP TABLE "preguntas";
ALTER TABLE "new_preguntas" RENAME TO "preguntas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
