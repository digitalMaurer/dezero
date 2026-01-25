-- Add duplicate fields to preguntas and create merge/false-positive tables
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
    "tip" TEXT,
    "explicacion" TEXT,
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
    CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preguntas_masterPreguntaId_fkey" FOREIGN KEY ("masterPreguntaId") REFERENCES "preguntas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_preguntas" (
    "id", "titulo", "enunciado", "opcionA", "opcionB", "opcionC", "opcionD", "respuestaCorrecta", "tip", "explicacion", "dificultad", "status", "imageUrl", "duplicateStatus", "masterPreguntaId", "easeFactor", "interval", "dueDate", "repetitions", "lastReview", "temaId", "createdAt", "updatedAt"
)
SELECT
    "id", "titulo", "enunciado", "opcionA", "opcionB", "opcionC", "opcionD", "respuestaCorrecta", "tip", "explicacion", "dificultad", "status", "imageUrl", 'ACTIVE', NULL, "easeFactor", "interval", "dueDate", "repetitions", "lastReview", "temaId", "createdAt", "updatedAt"
FROM "preguntas";

DROP TABLE "preguntas";
ALTER TABLE "new_preguntas" RENAME TO "preguntas";

-- Merge history table
CREATE TABLE "pregunta_merge_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterPreguntaId" TEXT NOT NULL,
    "duplicateIds" TEXT NOT NULL,
    "mergeStrategy" TEXT NOT NULL,
    "mergedBy" TEXT NOT NULL,
    "mergedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "merge_master_fkey" FOREIGN KEY ("masterPreguntaId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- False positive table
CREATE TABLE "duplicate_false_positives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preguntaAId" TEXT NOT NULL,
    "preguntaBId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fp_a_fkey" FOREIGN KEY ("preguntaAId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fp_b_fkey" FOREIGN KEY ("preguntaBId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "duplicate_false_positives_pair" ON "duplicate_false_positives" ("preguntaAId", "preguntaBId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
