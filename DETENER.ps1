# Script para detener el Sistema de Preparacion de Oposiciones
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deteniendo Sistema de Oposiciones" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Buscando procesos de Node.js..." -ForegroundColor Yellow
Write-Host ""

# Detener proceso en puerto 4100 (Backend)
Write-Host "[1/2] Deteniendo Backend (puerto 4100)..." -ForegroundColor Red
$backendProcess = Get-NetTCPConnection -LocalPort 4100 -ErrorAction SilentlyContinue
if ($backendProcess) {
    $processId = $backendProcess.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "     - Proceso $processId detenido" -ForegroundColor Green
} else {
    Write-Host "     - No hay proceso corriendo en el puerto 4100" -ForegroundColor Gray
}

# Detener proceso en puerto 5173 (Frontend)
Write-Host "[2/2] Deteniendo Frontend (puerto 5173)..." -ForegroundColor Red
$frontendProcess = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendProcess) {
    $processId = $frontendProcess.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "     - Proceso $processId detenido" -ForegroundColor Green
} else {
    Write-Host "     - No hay proceso corriendo en el puerto 5173" -ForegroundColor Gray
}

# Detener todos los procesos de Node.js relacionados (opcional, mas agresivo)
Write-Host ""
Write-Host "[*] Limpiando procesos de Node.js restantes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like "*Backend*" -or 
    $_.MainWindowTitle -like "*Frontend*" -or
    $_.MainWindowTitle -like "*OpoTest*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA DETENIDO CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puedes volver a iniciarlo con INICIAR.bat o INICIAR.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Enter para cerrar..." -ForegroundColor Gray
Read-Host
