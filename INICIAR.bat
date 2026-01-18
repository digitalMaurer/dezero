@echo off
echo ========================================
echo   Sistema de Preparacion de Oposiciones
echo ========================================
echo.
echo [*] Iniciando Backend (puerto 4100)...
start "Backend - OpoTest" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul

echo [*] Iniciando Frontend (puerto 5173)...
start "Frontend - OpoTest" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Backend:  http://localhost:4100
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause > nul

echo [*] Abriendo navegador...
start http://localhost:5173

echo.
echo Para DETENER el sistema, ejecuta DETENER.bat
echo.
pause
