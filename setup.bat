@echo off
echo.
echo ========================================
echo  SETUP DEL SISTEMA DE TESTS OPOSICIONES
echo ========================================
echo.

echo [1/5] Verificando Node.js...
node --version
npm --version
echo OK!
echo.

echo [2/5] Instalando dependencias Backend...
cd backend
call npm install
if errorlevel 1 (
    echo Error en instalacion del backend
    exit /b 1
)
cd ..
echo OK!
echo.

echo [3/5] Instalando dependencias Frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo Error en instalacion del frontend
    exit /b 1
)
cd ..
echo OK!
echo.

echo [4/5] Creando archivos .env...
copy backend\.env.example backend\.env > nul
copy frontend\.env.example frontend\.env > nul
echo OK!
echo.

echo [5/5] Creando base de datos...
echo.
echo IMPORTANTE: Para que esto funcione, PostgreSQL debe estar instalado y corriendo.
echo Si no tienes PostgreSQL:
echo   1. Descarga: https://www.postgresql.org/download/windows/
echo   2. Instala con contraseña: postgres
echo   3. Reinicia esta script
echo.

:: Intenta conectarse a PostgreSQL
psql -U postgres -h localhost -c "CREATE DATABASE oposiciones_db;" 2>nul
if errorlevel 1 (
    echo.
    echo ADVERTENCIA: No se pudo conectar a PostgreSQL
    echo Por favor instala PostgreSQL primero
    exit /b 1
)
echo OK!
echo.

echo ========================================
echo SETUP COMPLETADO EXITOSAMENTE!
echo ========================================
echo.
echo PROXIMOS PASOS:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run prisma:migrate
echo   npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Luego abre: http://localhost:5173
echo.
pause
