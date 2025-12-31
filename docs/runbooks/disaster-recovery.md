# Disaster Recovery Runbook

**MonoPass Club - Procedimientos de Recuperación de Desastres**

---

## 🚨 Escenarios de Emergencia

### 1. Pérdida Total de Base de Datos

**Severidad**: CRÍTICA  
**RTO (Recovery Time Objective)**: < 30 minutos  
**RPO (Recovery Point Objective)**: < 24 horas

#### Síntomas
- Aplicación no puede conectar a PostgreSQL
- Errores `ECONNREFUSED` o `connection timeout`
- Base de datos corrupta o sin acceso

#### Procedimiento de Recovery

**Paso 1: Detener servicios**
```bash
# Detener Core API
pm2 stop core-api
# O si usa npm/docker
docker compose down core-api

# Detener Scanner Service
pm2 stop scanner-service
# O
docker compose down scanner-service
```

**Paso 2: Verificar estado PostgreSQL**
```bash
# Verificar si el proceso está corriendo
docker compose ps postgres
# O
systemctl status postgresql

# Ver logs
docker compose logs postgres --tail=100
```

**Paso 3: Restaurar desde backup más reciente**
```bash
cd /path/to/monopass-club

# Listar backups disponibles
ls -lht backups/monopass_backup_*.dump

# Ejecutar script restore (modo interactivo)
bash scripts/restore-postgresql.sh

# O especificar backup directamente
bash scripts/restore-postgresql.sh backups/monopass_backup_20250130_030000.dump
```

**Paso 4: Validar restore**
```bash
# Conectar a la base de datos
psql -h localhost -U postgres -d monopass

# Verificar tablas principales
\dt

# Contar usuarios
SELECT COUNT(*) FROM "User";

# Verificar integridad eventos
SELECT COUNT(*) FROM "Event";
```

**Paso 5: Ejecutar migraciones Prisma** (si hay cambios pendientes)
```bash
npm run prisma:migrate deploy -w core-api
```

**Paso 6: Reiniciar servicios**
```bash
pm2 start core-api
pm2 start scanner-service

# O con docker
docker compose up -d core-api scanner-service
```

**Paso 7: Verificar healthchecks**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

curl http://localhost:3001/scanner-api/health
# Expected: {"status":"ok","uptime":...}
```

**Paso 8: Smoke test funcionalidad crítica**
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager.demo","password":"changeme123"}'

# Debe retornar token JWT
```

---

### 2. Corrupción de Datos

**Severidad**: ALTA  
**Síntomas**: 
- Queries fallan con errores de integridad
- Datos inconsistentes
- Foreign key violations

#### Procedimiento

**Opción A: Restore parcial** (si el backup es reciente)
```bash
# Exportar datos críticos actuales que estén OK
pg_dump -h localhost -U postgres -d monopass \
  -t User -t Club -t Event \
  -F c -f /tmp/critical_data.dump

# Restaurar backup completo
bash scripts/restore-postgresql.sh

# Re-importar datos críticos si necesario
# (evaluar caso por caso)
```

**Opción B: Reparación manual**
```sql
-- Identificar foreign keys rotas
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'pg_catalog'
  );

-- Limpiar registros huérfanos (CUIDADO: evaluar impacto)
DELETE FROM "Ticket" WHERE "assignmentId" NOT IN (SELECT id FROM "EventAssignment");
```

---

### 3. Backups Fallando

**Severidad**: MEDIA (pero CRÍTICA si se extiende > 48h)  
**Síntomas**:
- Cron job falla
- Backups antiguos (> 24h)
- Alertas no recibidas

#### Diagnóstico

**Verificar logs cron**
```bash
# En Linux
grep CRON /var/log/syslog | grep backup-postgresql

# En Windows (Task Scheduler)
Get-EventLog -LogName Application -Source "Task Scheduler"
```

**Verificar permisos**
```bash
# Script debe ser ejecutable
chmod +x scripts/backup-postgresql.sh

# Directorio backups debe ser writable
ls -ld backups/
```

**Test manual del script**
```bash
bash scripts/backup-postgresql.sh
# Debe completar sin errores
```

**Verificar espacio en disco**
```bash
df -h
# Debe tener al menos 10GB libres
```

#### Solución

**Re-configurar cron job**
```bash
# Editar crontab
crontab -e

# Agregar job (3 AM diario)
0 3 * * * cd /path/to/monopass-club && bash scripts/backup-postgresql.sh >> /var/log/monopass-backup.log 2>&1
```

**Setup alertas email** (opcional)
```bash
# Agregar al final de backup-postgresql.sh
if [ $? -eq 0 ]; then
  echo "Backup exitoso $(date)" | mail -s "MonoPass Backup OK" admin@example.com
else
  echo "Backup FALLÓ $(date)" | mail -s "MonoPass Backup FAILED" admin@example.com
fi
```

---

### 4. Fallo Completo de Servidor

**Severidad**: CRÍTICA  
**RTO**: < 1 hora  
**Síntomas**: Servidor inacc esible, hardware failure

#### Procedimiento

**Paso 1: Provisionar nuevo servidor/container**
```bash
# Opción A: Docker
docker run -d \
  --name monopass-postgres \
  -e POSTGRES_PASSWORD=<secret> \
  -p 5432:5432 \
  postgres:16

# Opción B: Cloud (AWS RDS, Azure PostgreSQL, etc.)
# Usar consola cloud para crear instancia
```

**Paso 2: Restaurar backup desde storage remoto**
```bash
# Si backups están en S3
aws s3 cp s3://monopass-backups/monopass_backup_latest.dump ./backups/

# Si están en Azure Blob
az storage blob download \
  --account-name monopassstorage \
  --container-name backups \
  --name monopass_backup_latest.dump \
  --file ./backups/monopass_backup_latest.dump
```

**Paso 3: Restore (ver procedimiento Escenario 1)**

**Paso 4: Actualizar variables de entorno**
```bash
# Actualizar DATABASE_URL en servicios
# core-api/.env
DATABASE_URL="postgresql://postgres:password@new-server:5432/monopass"

# scanner-service/.env
DATABASE_URL="postgresql://postgres:password@new-server:5432/monopass"
```

**Paso 5: Reiniciar servicios y validar**

---

## 📊 Matriz de Decisión Rápida

| Situación | Acción Inmediata | Script/Comando |
|-----------|------------------|----------------|
| DB no responde | Check proceso PostgreSQL | `docker compose ps postgres` |
| App no conecta | Verificar DATABASE_URL | `echo $DATABASE_URL` |
| Datos corruptos | Restore último backup | `bash scripts/restore-postgresql.sh` |
| Backup antiguo | Ejecutar backup manual | `bash scripts/backup-postgresql.sh` |
| Servidor caído | Provisionar nuevo + restore | Ver Escenario 4 |

---

## 🔐 Información Crítica

### Ubicación de Backups

**Local**: `./backups/monopass_backup_*.dump`  
**Remoto**: (configurar según infraestructura)
- S3: `s3://monopass-backups/`
- Azure: `monopassstorage/backups/`
- GCS: `gs://monopass-backups/`

### Retención de Backups

- **Local**: 7 días (automático via script)
- **Cloud**: 30 días (configurar lifecycle policy)

### Contactos de Emergencia

| Rol | Responsable | Contacto |
|-----|-------------|----------|
| Tech Lead | TBD | TBD |
| DevOps | TBD | TBD |
| DBA | TBD | TBD |

---

## ✅ Checklist Post-Recovery

Después de cualquier recovery, ejecutar:

- [ ] Servicios core-api y scanner-service corriendo
- [ ] Healthchecks `/api/health` y `/scanner-api/health` OK
- [ ] Login funcional (test con usuario demo)
- [ ] Generación de tickets funcional
- [ ] Scanner validation/confirm funcional
- [ ] Cortes mostrando datos
- [ ] Logs sin errores críticos
- [ ] Monitoring dashboards actualizándose
- [ ] Backup automático programado ejecutándose
- [ ] Incidente documentado en post-mortem

---

## 📝 Post-Mortem Template

Después de cada incidente, completar:

```markdown
# Post-Mortem: [Título Incidente]

**Fecha**: YYYY-MM-DD  
**Duración downtime**: X horas  
**Impacto**: # usuarios afectados

## Resumen
[Qué pasó]

## Timeline
- HH:MM - Detección inicial
- HH:MM - Inicio recovery
- HH:MM - Servicios restaurados

## Root Cause
[Causa raíz]

## Resolución
[Cómo se resolvió]

## Acción Items
- [ ] Item 1
- [ ] Item 2

**Responsable documen to**: [Name]
```

---

**Última actualización**: 2025-12-30  
**Versión**: 1.0  
**Dueño**: Equipo MonoPass Club DevOps
