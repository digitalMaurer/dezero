@echo off
echo ========================================
echo   Deteniendo Sistema de Oposiciones
echo ========================================
echo.

echo [*] Buscando procesos de Node.js...
echo.

REM Matar procesos de Node en puerto 4100 (Backend)
echo [1/2] Deteniendo Backend (puerto 4100)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4100" ^| findstr "LISTENING"') do (
    echo     - Deteniendo proceso %%a
    taskkill /F /PID %%a > nul 2>&1
)

REM Matar procesos de Node en puerto 5173 (Frontend)
echo [2/2] Deteniendo Frontend (puerto 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo     - Deteniendo proceso %%a
    taskkill /F /PID %%a > nul 2>&1
)

REM Cerrar ventanas de comando con titulos especificos
taskkill /FI "WINDOWTITLE eq Backend - OpoTest*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - OpoTest*" /F > nul 2>&1

echo.
echo ========================================
echo   SISTEMA DETENIDO CORRECTAMENTE
echo ========================================
echo.
echo Puedes volver a iniciarlo con INICIAR.bat
echo.
pause
