#!/bin/bash

################################################################################
# MonoPass Club - PostgreSQL Restore Script
#
# Este script restaura un backup de PostgreSQL desde un archivo .dump
#
# Uso: ./scripts/restore-postgresql.sh [backup_file]
#      Si no se especifica archivo, muestra lista de backups disponibles
################################################################################

set -e  # Exit on error

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-monopass}"
DB_USER="${DB_USER:-postgres}"

# Función para listar backups disponibles
list_backups() {
    echo "================================================"
    echo "Backups Disponibles"
    echo "================================================"
    
    if ls "${BACKUP_DIR}"/monopass_backup_*.dump 1> /dev/null 2>&1; then
        ls -lht "${BACKUP_DIR}"/monopass_backup_*.dump | awk '{print NR". "$9" ("$5", "$6" "$7" "$8")"}'
    else
        echo "No hay backups disponibles en ${BACKUP_DIR}"
        exit 1
    fi
    
    echo "================================================"
}

# Si no se proporciona archivo, mostrar lista y pedir selección
if [ -z "$1" ]; then
    list_backups
    echo ""
    read -p "Ingresa el número del backup a restaurar (o ruta completa): " SELECTION
    
    if [[ "$SELECTION" =~ ^[0-9]+$ ]]; then
        # Es un número, obtener el archivo correspondiente
        BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/monopass_backup_*.dump | sed -n "${SELECTION}p")
    else
        # Es una ruta
        BACKUP_FILE="$SELECTION"
    fi
else
    BACKUP_FILE="$1"
fi

# Validar que el archivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ ERROR: Archivo de backup no encontrado: ${BACKUP_FILE}"
    exit 1
fi

echo "================================================"
echo "MonoPass Club - PostgreSQL Restore"
echo "================================================"
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo "================================================"

# Advertencia crítica
echo ""
echo "⚠️  ADVERTENCIA CRÍTICA"
echo "⚠️  Esta operación ELIMINARÁ todos los datos actuales"
echo "⚠️  y los reemplazará con el contenido del backup"
echo ""
read -p "¿Estás seguro de continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo "Iniciando restore..."
echo "1. Terminando conexiones activas..."

# Terminar conexiones activas a la base de datos
psql -h "${DB_HOST}" \
     -p "${DB_PORT}" \
     -U "${DB_USER}" \
     -d postgres \
     -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid != pg_backend_pid();" > /dev/null 2>&1 || true

echo "2. Eliminando base de datos existente..."
dropdb -h "${DB_HOST}" \
       -p "${DB_PORT}" \
       -U "${DB_USER}" \
       --if-exists \
       "${DB_NAME}"

echo "3. Creando base de datos limpia..."
createdb -h "${DB_HOST}" \
         -p "${DB_PORT}" \
         -U "${DB_USER}" \
         "${DB_NAME}"

echo "4. Restaurando backup..."
pg_restore -h "${DB_HOST}" \
           -p "${DB_PORT}" \
           -U "${DB_USER}" \
           -d "${DB_NAME}" \
           -v \
           "${BACKUP_FILE}"

echo ""
echo "5. Validando restore..."

# Contar tablas restauradas
TABLE_COUNT=$(psql -h "${DB_HOST}" \
                   -p "${DB_PORT}" \
                   -U "${DB_USER}" \
                   -d "${DB_NAME}" \
                   -t \
                   -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

echo "   Tablas restauradas: ${TABLE_COUNT}"

if [ "${TABLE_COUNT}" -gt 0 ]; then
    echo "✅ Restore completado exitosamente"
else
    echo "⚠️  WARNING: No se encontraron tablas. Verifica el backup."
fi

echo ""
echo "================================================"
echo "Restore completado: $(date)"
echo "================================================"
echo ""
echo "SIGUIENTE PASO: Ejecuta migraciones Prisma si es necesario:"
echo "  npm run prisma:migrate -w core-api"

exit 0
