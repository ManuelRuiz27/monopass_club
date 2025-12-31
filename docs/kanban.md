# Tablero Kanban Sprint 0

1. Crear un GitHub Project (beta) llamado MonoPass Sprint 0.
2. Columnas sugeridas:
   - **Backlog**: historias del SRS/backlog pendientes de priorizar.
   - **Ready**: items con criterios claros para tomar en sprint actual.
   - **In Progress**: en desarrollo activo.
   - **Review/QA**: esperando code review o pruebas.
   - **Done**: mergeado + deploy local verificado.
3. Automatizaciones recomendadas:
   - Mover a *In Progress* cuando se asigne un PR.
   - Mover a *Review/QA* cuando el PR reciba la etiqueta eady-for-review.
   - Cerrar tarjeta al hacer merge del PR.
4. Vincula la plantilla de PR (.github/PULL_REQUEST_TEMPLATE.md) para que cada PR cree la tarjeta automáticamente.