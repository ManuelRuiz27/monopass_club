#!/bin/bash

################################################################################
# MonoPass Club - PostgreSQL Backup Script
# 
# Este script crea backups automáticos de la base de datos PostgreSQL
# en formato custom comprimido con timestamp.
#
# Uso: ./scripts/backup-postgresql.sh
################################################################################

set -e  # Exit on error

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-monopass}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Timestamp para nombre único
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="monopass_backup_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Crear directorio backups si no existe
mkdir -p "${BACKUP_DIR}"

echo "================================================"
echo "MonoPass Club - PostgreSQL Backup"
echo "================================================"
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo "================================================"

# Ejecutar pg_dump con formato custom (comprimido)
echo "Iniciando backup..."
pg_dump -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -F c \
        -b \
        -v \
        -f "${BACKUP_PATH}"

# Verificar que el backup se creó correctamente
if [ -f "${BACKUP_PATH}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    echo "✅ Backup completado exitosamente"
    echo "   Archivo: ${BACKUP_PATH}"
    echo "   Tamaño: ${BACKUP_SIZE}"
else
    echo "❌ ERROR: Backup falló - archivo no encontrado"
    exit 1
fi

# Limpiar backups antiguos (retención configurable)
echo ""
echo "Limpiando backups antiguos (retención: ${RETENTION_DAYS} días)..."
find "${BACKUP_DIR}" -name "monopass_backup_*.dump" -type f -mtime +${RETENTION_DAYS} -delete
echo "✅ Limpieza completada"

# Listar backups actuales
echo ""
echo "Backups actuales:"
ls -lh "${BACKUP_DIR}"/monopass_backup_*.dump 2>/dev/null || echo "  (ninguno)"

echo ""
echo "================================================"
echo "Backup completado: $(date)"
echo "================================================"

# Opcional: Upload a cloud storage (descomentar si se configura)
# if [ -n "${AWS_S3_BUCKET}" ]; then
#     echo "Uploading to S3: s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}"
#     aws s3 cp "${BACKUP_PATH}" "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}"
#     echo "✅ S3 upload completado"
# fi

exit 0
