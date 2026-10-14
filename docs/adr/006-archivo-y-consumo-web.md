# ADR-006: Archivo diario y consumo desde el portafolio

## Estado
Aceptada · 2026-10-14

## Contexto
Cada digest se enviaba a Telegram y se perdía. Se quiere un archivo
público y una página `/radar` en el portafolio (carlosemendez.com,
Astro desplegado en Cloudflare).

## Decisión
- Cada ejecución escribe `archive/YYYY-MM-DD.json` (contrato para
  máquinas), `archive/YYYY-MM-DD.md` (lectura humana, derivado del JSON)
  e `archive/index.json` (lista de fechas).
- El archivo se escribe antes de enviar a Telegram y es idempotente.
- El portafolio consume `index.json` desde raw.githubusercontent.com con
  `fetch` en el navegador.

## Alternativas consideradas
- Leer los datos en build time: mejor SEO, pero el push del bot ocurre en
  otro repo y no dispara el build del portafolio. Se podría añadir un
  Deploy Hook de Cloudflare al final del workflow.

## Consecuencias
- La página se actualiza sola, sin rebuild.
- Depende de JS y de GitHub en el cliente.
- Como el formato JSON es el contrato, cambiar a build time después no
  requiere tocar el bot.
