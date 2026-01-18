#!/bin/sh

set -e

echo "Esperando a que PostgreSQL esté disponible..."
sleep 10

echo "PostgreSQL debería estar disponible!"
echo "Ejecutando migraciones de Prisma..."

npx prisma db push --skip-generate || true

echo "Base de datos lista!"
echo "Iniciando servidor..."

npm run dev
