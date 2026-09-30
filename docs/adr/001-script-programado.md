# ADR_001: Script programado en GitHub Actions en lugar de un servicio

**Estado** aceptado · **Fecha** 2026-09-29

## Contexto

Radar Tech se ejecuta una vez al día, tarda menos de un minuto y no recibe peticiones externas.

## Decisión

Implementarlo como un script de Node.js + TypeScript ejecutado por un cron de GitHub Actions.

## Consecuencias

- Costo de Infraestrucutra $0 y cero mantenimiento de servidor.
- Código simple: el flujo se lee de arriba abajo.
- El cron de GitHub puede retrasarse algunos minutos (aceptable para un digest).
- Si en el futoro necesita una API o panel, se reevaluará (NestJS sería candidato).
