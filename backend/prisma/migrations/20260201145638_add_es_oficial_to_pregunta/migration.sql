-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pregunta_merge_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterPreguntaId" TEXT NOT NULL,
    "duplicateIds" TEXT NOT NULL,
    "mergeStrategy" TEXT NOT NULL,
    "mergedBy" TEXT NOT NULL,
    "mergedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pregunta_merge_history_masterPreguntaId_fkey" FOREIGN KEY ("masterPreguntaId") REFERENCES "preguntas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pregunta_merge_history" ("duplicateIds", "id", "masterPreguntaId", "mergeStrategy", "mergedAt", "mergedBy") SELECT "duplicateIds", "id", "masterPreguntaId", "mergeStrategy", "mergedAt", "mergedBy" FROM "pregunta_merge_history";
DROP TABLE "pregunta_merge_history";
ALTER TABLE "new_pregunta_merge_history" RENAME TO "pregunta_merge_history";
CREATE TABLE "new_preguntas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opcionA" TEXT NOT NULL,
    "opcionB" TEXT NOT NULL,
    "opcionC" TEXT NOT NULL,
    "opcionD" TEXT,
    "respuestaCorrecta" TEXT NOT NULL,
    "tip" TEXT,
    "explicacion" TEXT,
    "esOficial" BOOLEAN NOT NULL DEFAULT false,
    "dificultad" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "imageUrl" TEXT,
    "duplicateStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "masterPreguntaId" TEXT,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lastReview" DATETIME,
    "temaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "preguntas_masterPreguntaId_fkey" FOREIGN KEY ("masterPreguntaId") REFERENCES "preguntas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_preguntas" ("createdAt", "dificultad", "dueDate", "duplicateStatus", "easeFactor", "enunciado", "explicacion", "id", "imageUrl", "interval", "lastReview", "masterPreguntaId", "opcionA", "opcionB", "opcionC", "opcionD", "repetitions", "respuestaCorrecta", "status", "temaId", "tip", "titulo", "updatedAt") SELECT "createdAt", "dificultad", "dueDate", "duplicateStatus", "easeFactor", "enunciado", "explicacion", "id", "imageUrl", "interval", "lastReview", "masterPreguntaId", "opcionA", "opcionB", "opcionC", "opcionD", "repetitions", "respuestaCorrecta", "status", "temaId", "tip", "titulo", "updatedAt" FROM "preguntas";
DROP TABLE "preguntas";
ALTER TABLE "new_preguntas" RENAME TO "preguntas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineIndex
DROP INDEX "duplicate_false_positives_pair";
CREATE UNIQUE INDEX "duplicate_false_positives_preguntaAId_preguntaBId_key" ON "duplicate_false_positives"("preguntaAId", "preguntaBId");
