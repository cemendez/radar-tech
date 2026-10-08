# Radar Tech

Bot que cada mañana lee fuentes técnicas curadas, selecciona con IA las 10 noticias más relevantes sobre **IA, programación, arquitectura de software, herramientas para desarrolladores y hardware**, y las envía resumidas en español por Telegram.

Proyecto construido en público para documentar decisiones de arquitectura mientras amplío mi stack de Laravel/PHP a Node.js + TypeScript.

## Estado

| Versión | Qué incluye | Estado |
| --- | --- | --- |
| [v0.1](https://github.com/cemendez/radar-tech/releases/tag/v0.1) | Lectura de feeds RSS en paralelo con tolerancia a fallos | ✓ |
| [v0.2](https://github.com/cemendez/radar-tech/releases/tag/v0.2) | Selección y resumen con IA (modelos open-weights en tier gratuito) | ✗ |
| [v0.3](https://github.com/cemendez/radar-tech/releases/tag/v0.3) | Envío a Telegram, ejecución diaria con GitHub Actions y control de duplicados | ✗ |
| v0.4 | Ajustes basados en la operación real | ✗ |
| v1.0 | Archivo histórico y página pública en el portafolio | ✗ |

## Cómo funciona (v0.2)

1. Lee las fuentes definidas en `src/sources.ts` en paralelo; si una falla, las demás continúan.
2. **Selección:** un LLM elige las 10 noticias más relevantes viendo solo títulos y extractos cortos.
3. **Enriquecimiento:** para las elegidas con poco texto, descarga la descripción del artículo.
4. **Resumen:** el LLM resume en español solo esas 10, usando únicamente el texto disponible.
5. Cada respuesta del modelo se valida; si no cumple el formato, se reintenta.

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

## Estructura

```bash
src/
├── sources.ts   # configuración: qué fuentes leer
├── feeds.ts     # descarga y normalización de artículos
├── llm.ts       # cliente del modelo: reintentos, respaldo y validación
├── rank.ts      # selección y resumen en dos etapas
├── enrich.ts    # descripción de artículos con extracto pobre
└── index.ts     # punto de entrada
docs/adr/        # decisiones de arquitectura
```

## Decisiones de arquitectura

- [ADR-001: Script programado en lugar de un servicio](docs/adr/001-script-programado.md)
- [ADR-002: Curaduría con un LLM open-weights en dos etapas](docs/adr/002-curaduria-con-llm.md)
- [ADR-003: Las respuestas del LLM como datos externos no confiables](docs/adr/003-respuestas-del-llm-como-datos-externos.md)
- [ADR-004: Estado en el repositorio](docs/adr/004-estado-en-el-repositorio.md)

## Autor

Carlos Méndez · [carlosemendez.com](https://carlosemendez.com)
