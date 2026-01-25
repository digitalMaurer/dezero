-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_oposiciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_oposiciones" ("codigo", "createdAt", "descripcion", "id", "nombre", "updatedAt") SELECT "codigo", "createdAt", "descripcion", "id", "nombre", "updatedAt" FROM "oposiciones";
DROP TABLE "oposiciones";
ALTER TABLE "new_oposiciones" RENAME TO "oposiciones";
CREATE UNIQUE INDEX "oposiciones_codigo_key" ON "oposiciones"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
