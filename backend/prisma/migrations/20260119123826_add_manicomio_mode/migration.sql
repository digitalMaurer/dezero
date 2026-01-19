-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_test_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "oposicionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "cantidadCorrectas" INTEGER NOT NULL,
    "cantidadIncorrectas" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'ALEATORIO',
    "streakCurrent" INTEGER NOT NULL DEFAULT 0,
    "streakMax" INTEGER NOT NULL DEFAULT 0,
    "tiempoInicio" DATETIME NOT NULL,
    "tiempoFin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_attempts_oposicionId_fkey" FOREIGN KEY ("oposicionId") REFERENCES "oposiciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_test_attempts" ("cantidadCorrectas", "cantidadIncorrectas", "createdAt", "id", "oposicionId", "puntaje", "testId", "tiempoFin", "tiempoInicio", "updatedAt", "userId") SELECT "cantidadCorrectas", "cantidadIncorrectas", "createdAt", "id", "oposicionId", "puntaje", "testId", "tiempoFin", "tiempoInicio", "updatedAt", "userId" FROM "test_attempts";
DROP TABLE "test_attempts";
ALTER TABLE "new_test_attempts" RENAME TO "test_attempts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
