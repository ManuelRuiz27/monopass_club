# Backup PowerShell Script for Windows
# MonoPass Club - PostgreSQL Backup

param(
    [string]$BackupDir = ".\backups",
    [string]$DbHost = $env:DB_HOST ?? "localhost",
    [string]$DbPort = $env:DB_PORT ?? "5432",
    [string]$DbName = $env:DB_NAME ?? "monopass",
    [string]$DbUser = $env:DB_USER ?? "postgres",
    [int]$RetentionDays = $env:RETENTION_DAYS ?? 7
)

$ErrorActionPreference = "Stop"

# Timestamp para nombre único
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "monopass_backup_$Timestamp.dump"
$BackupPath = Join-Path $BackupDir $BackupFile

# Crear directorio si no existe
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "MonoPass Club - PostgreSQL Backup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date)"
Write-Host "Database: $DbName"
Write-Host "Host: ${DbHost}:${DbPort}"
Write-Host "Backup file: $BackupFile"
Write-Host "================================================" -ForegroundColor Cyan

# Ejecutar pg_dump
Write-Host "`nIniciando backup..." -ForegroundColor Yellow

$env:PGPASSWORD = Read-Host "PostgreSQL password" -AsSecureString | ConvertFrom-SecureString -AsPlainText

& pg_dump -h $DbHost `
         -p $DbPort `
         -U $DbUser `
         -d $DbName `
         -F c `
         -b `
         -v `
         -f $BackupPath

if (Test-Path $BackupPath) {
    $BackupSize = (Get-Item $BackupPath).Length / 1MB
    Write-Host "`n✅ Backup completado exitosamente" -ForegroundColor Green
    Write-Host "   Archivo: $BackupPath" -ForegroundColor Green
    Write-Host "   Tamaño: $([math]::Round($BackupSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "`n❌ ERROR: Backup falló - archivo no encontrado" -ForegroundColor Red
    exit 1
}

# Limpiar backups antiguos
Write-Host "`nLimpiando backups antiguos (retención: $RetentionDays días)..." -ForegroundColor Yellow
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "monopass_backup_*.dump" | 
    Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
    Remove-Item -Force

Write-Host "✅ Limpieza completada" -ForegroundColor Green

# Listar backups actuales
Write-Host "`nBackups actuales:" -ForegroundColor Cyan
Get-ChildItem -Path $BackupDir -Filter "monopass_backup_*.dump" | 
    Sort-Object LastWriteTime -Descending |
    Format-Table Name, @{Label="Tamaño";Expression={"{0:N2} MB" -f ($_.Length / 1MB)}}, LastWriteTime -AutoSize

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Backup completado: $(Get-Date)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Limpiar password del entorno
$env:PGPASSWORD = $null
