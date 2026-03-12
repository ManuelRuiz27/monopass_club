# Documentacion MonoPass Club

Este directorio es la fuente canonica de documentacion transversal del monorepo.

## Navegacion rapida

- Arquitectura: `Architecture.md`
- API: `API_Documentation.md`
- Deploy y operacion: `Deployment_Manual.md`, `runbooks/disaster-recovery.md`, `Incident_Response_Plan.md`, `security.md`
- Producto y backlog: `Requirements_and_Backlog.md`, `BACKLOG_MonoPass_Club_MVP.md`, `SRS_MonoPass_Club_MVP.md`
- Manuales: `Manual_Usuario_Gerente.md`, `Manual_Usuario_RP.md`, `Manual_Usuario_Scanner.md`
- Landing: `landing/`
- Planes internos: `plans/`

## Documentacion por dominio

- `landing/`: estrategia, handoff tecnico, evidencia Lighthouse y contrato de la API publica de landing.
- `runbooks/`: recuperacion y operacion.
- `screenshots/`: material visual y capturas de apoyo.
- `plans/`: planes de implementacion historicos que antes estaban en la raiz.

## Readmes por workspace

La documentacion operativa que depende del codigo sigue junto al workspace:

- `../core-api/README.md`
- `../scanner-service/README.md`
- `../frontend/README.md`
- `../landing/README.md`

## Convencion

Si un documento existe tanto aqui como en otra ubicacion, la version dentro de `docs/` debe considerarse la referencia principal, salvo evidencia cruda de QA dentro de `qa/`.
