# Simple backup script for the Prisma SQLite database (dev.db)
# Usage: pwsh .\backup-db.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $root 'prisma\dev.db'
$backupDir = Join-Path $root 'backups'

if (-not (Test-Path $dbPath)) {
    throw "Database file not found at $dbPath"
}

if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest = Join-Path $backupDir "dev_$timestamp.db"

Copy-Item -Path $dbPath -Destination $dest -Force
Write-Host "Backup created:" $dest
