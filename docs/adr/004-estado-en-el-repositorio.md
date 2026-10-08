# ADR-004: El estado de duplicados se guarda como JSON versionado en el repositorio

**Estado:** aceptado · **Fecha:** 2026-10-07

## Contexto

Radar Tech se ejecuta cada día en GitHub Actions, que arranca una máquina nueva en cada corrida
y no conserva archivos entre ejecuciones. Para no enviar la misma noticia dos veces, el bot necesita
recordar qué enlaces ya envió. Los volúmenes son pequeños: unas decenas de enlaces por día,
retenidos durante 10 días.

## Decisión

- Guardar los enlaces enviados, con su fecha, en `state/seen.json` dentro del propio repositorio.
- El workflow hace commit de ese archivo al terminar cada ejecución.
- Los enlaces se normalizan antes de compararse (sin parámetros de rastreo, hash ni diagonal final), y además se descartan duplicados por título dentro de una misma ejecución.
- El estado se guarda solo después de enviar a Telegram con éxito.
- Los enlaces con más de 10 días se eliminan para que el archivo no crezca indefinidamente.

## Alternativas descartadas

- **Base de datos externa** (SQLite alojado, Postgres gratuito, KV de un proveedor): agrega una cuenta, credenciales y una pieza más que mantener, sin necesidad real para este volumen.
- **Caché o artefactos de GitHub Actions**: expiran y no dejan un historial fácil de revisar.

## Consecuencias

- Costo $0 y sin infraestructura adicional.
- Auditable: el historial de Git muestra qué se envió cada día.
- El commit diario mantiene activo el repositorio, evitando que GitHub pause el cron por inactividad.
- Si algo falla antes de enviar, las noticias siguen disponibles para el siguiente intento.
- Entrega "al menos una vez": si Telegram recibe el primer mensaje y falla el segundo, al día siguiente podrían repetirse algunas noticias. Es aceptable para un digest personal.
- Los commits del bot se mezclan con los de desarrollo, y un push local puede requerir `git pull --rebase`.
