# Script para iniciar el Sistema de Preparacion de Oposiciones
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Preparacion de Oposiciones" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si los procesos ya están corriendo
$backendRunning = Get-NetTCPConnection -LocalPort 4100 -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "[!] El backend ya esta corriendo en el puerto 4100" -ForegroundColor Yellow
} else {
    Write-Host "[*] Iniciando Backend (puerto 4100)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

if ($frontendRunning) {
    Write-Host "[!] El frontend ya esta corriendo en el puerto 5173" -ForegroundColor Yellow
} else {
    Write-Host "[*] Iniciando Frontend (puerto 5173)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:4100" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Enter para abrir el navegador..." -ForegroundColor Yellow
Read-Host

Write-Host "[*] Abriendo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Para DETENER el sistema, ejecuta DETENER.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para cerrar esta ventana..." -ForegroundColor Gray
Read-Host
