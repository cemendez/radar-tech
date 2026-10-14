# ADR-005: Disparo diario con un Cron Trigger de Cloudflare en lugar del schedule de GitHub

**Estado:** aceptado · **Fecha:** 2026-10-13

## Contexto

El workflow se programó con `schedule` de GitHub Actions para las 7:00 am (Puebla). En las tres
ejecuciones medidas arrancó entre 5 y 6 horas tarde:

| Programado (UTC) | Arrancó (UTC) | Retraso     |
| ---------------- | ------------- | ----------- |
| 13:00            | 19:13         | ~6 h 13 min |
| 12:23            | 18:24         | ~6 h 01 min |
| 12:23            | 17:22         | ~5 h        |

Mover el minuto fuera de la hora en punto no tuvo efecto. Se descartó un problema de zona horaria
comparando la hora UTC del log con la de los commits del bot.

## Decisión

- Un Worker de Cloudflare con un Cron Trigger (`55 14 * * *`, 8:55 am en Puebla) llama a la API de GitHub (`workflow_dispatch`).
- El workflow conserva solo `workflow_dispatch`; se eliminó el `schedule`.
- El token de GitHub es fine-grained, limitado a este repositorio y al permiso `Actions: write`, y se guarda como secret del Worker.
- Verificado en los logs del Worker el 2026-10-13: invocación 3 s después de lo programado y respuesta `204`.

## Alternativas descartadas

- **Mover el minuto del cron de GitHub:** probado, sin efecto.
- **cron-job.org:** más simple, pero agrega una cuenta y un servicio de terceros.

## Consecuencias

- Hora puntual y predecible.
- El Worker queda versionado en `worker/` y se despliega con Wrangler.
- El token expira el 2026-11-09; al vencer, el digest dejaría de llegar. Renovarlo antes y actualizar el secret con `wrangler secret put`.
- Una pieza más que mantener (cuenta de Cloudflare y Worker).
- Lo que corre en Cloudflare es lo último desplegado, no lo que dice Git: tras cambiar `wrangler.toml` hay que ejecutar `wrangler deploy` y comprobar el cron en el dashboard.
