-- CreateTable
CREATE TABLE "favorite_preguntas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_preguntas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorite_preguntas_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_preguntas_userId_preguntaId_key" ON "favorite_preguntas"("userId", "preguntaId");
