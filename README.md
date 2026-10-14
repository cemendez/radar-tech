# Radar Tech

Bot que cada mañana lee fuentes técnicas curadas, selecciona con IA las 10 noticias más relevantes sobre **IA, programación, arquitectura de software, herramientas para desarrolladores y hardware**, y las envía resumidas en español por Telegram.

Proyecto construido en público para documentar decisiones de arquitectura mientras amplío mi stack de Laravel/PHP a Node.js + TypeScript.

## Estado

| Versión                                                          | Qué incluye                                                        | Estado |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| [v0.1](https://github.com/cemendez/radar-tech/releases/tag/v0.1) | Lectura de feeds RSS en paralelo con tolerancia a fallos           | ✓      |
| [v0.2](https://github.com/cemendez/radar-tech/releases/tag/v0.2) | Selección y resumen con IA (modelos open-weights en tier gratuito) | ✓      |
| [v0.3](https://github.com/cemendez/radar-tech/releases/tag/v0.3) | Telegram, GitHub Actions y control de duplicados                   | ✓      |
| [v0.4](https://github.com/cemendez/radar-tech/releases/tag/v0.4) | Disparador externo y estabilidad en producción                     | ✓      |
| [v1.0](https://github.com/cemendez/radar-tech/releases/tag/v1.0) | Archivo histórico de cada digest en el repositorio                 | ✓      |
| Siguiente                                                        | Página pública `/radar` en el portafolio                           | ✗      |

## Cómo funciona (v1.0)

0. Un Cron Trigger de Cloudflare dispara el workflow cada día a las 8:55 am (el `schedule` de GitHub se retrasaba hasta 6 horas).
1. Lee las fuentes definidas en `src/sources.ts` en paralelo; si una falla, las demás continúan.
2. **Selección:** un LLM elige las 10 noticias más relevantes viendo solo títulos y extractos cortos.
3. **Enriquecimiento:** para las elegidas con poco texto, descarga la descripción del artículo.
4. **Resumen:** el LLM resume en español solo esas 10, usando únicamente el texto disponible.
5. Cada respuesta del modelo se valida; si no cumple el formato, se reintenta.
6. **Archivo:** el digest se guarda en `archive/` antes de enviarse, y luego se manda por Telegram.

## Requisitos

- Node.js 22 o superior
- pnpm

## Uso

Copia `.env.example` a `.env` y agrega tu API key de [Groq](https://console.groq.com/keys) (gratuita, sin tarjeta).

```bash
pnpm install
pnpm start       # ejecuta el programa
pnpm typecheck   # verifica los tipos de TypeScript
```

## Archivo

Cada digest enviado queda guardado en el repositorio:

```
archive/
├── index.json        # fechas disponibles, la más reciente primero
├── 2026-10-14.json   # datos del digest
└── 2026-10-14.md     # versión legible
```

Formato de `archive/YYYY-MM-DD.json`:

```json
{
    "date": "2026-10-14",
    "items": [
        {
            "title": "Título de la noticia",
            "url": "https://...",
            "summary": "Resumen en español",
            "source": "Nombre de la fuente"
        }
    ]
}
```

Este formato es el contrato público: el JSON es la fuente de verdad y el Markdown se deriva de él. Decisión documentada en [ADR-006](docs/adr/006-archivo-y-consumo-web.md).

## Estructura

```bash
src/
├── sources.ts   # configuración: qué fuentes leer
├── feeds.ts     # descarga y normalización de artículos
├── llm.ts       # cliente del modelo: reintentos, respaldo y validación
├── rank.ts      # selección y resumen en dos etapas
├── enrich.ts    # descripción de artículos con extracto pobre
├── archive.ts   # archivo diario: JSON, Markdown e índice
└── index.ts     # punto de entrada
archive/         # historial de digests (lo escribe el bot)
state/           # control de duplicados (seen.json)
worker/          # Worker de Cloudflare que dispara el workflow
docs/adr/        # decisiones de arquitectura
```

## Decisiones de arquitectura

- [ADR-001: Script programado en lugar de un servicio](docs/adr/001-script-programado.md)
- [ADR-002: Curaduría con un LLM open-weights en dos etapas](docs/adr/002-curaduria-con-llm.md)
- [ADR-003: Las respuestas del LLM como datos externos no confiables](docs/adr/003-respuestas-del-llm-como-datos-externos.md)
- [ADR-004: El estado de duplicados como JSON versionado en el repositorio](docs/adr/004-estado-en-el-repositorio.md)
- [ADR-005: Disparador externo con Cloudflare en lugar del schedule de GitHub](docs/adr/005-disparador-externo.md)
- [ADR-006: Archivo diario y consumo desde el portafolio](docs/adr/006-archivo-y-consumo-web.md)

## Despliegue del Worker

Desde `worker/`:

    pnpm install
    pnpm wrangler secret put GITHUB_TOKEN
    pnpm wrangler deploy

El token (fine-grained, `Actions: write`) vence periódicamente y debe renovarse.

## Autor

Carlos Méndez · [carlosemendez.com](https://carlosemendez.com)
