# Radar Tech

Bot que cada mañana lee fuentes técnicas curadas, selecciona con IA las 10 noticias más relevantes sobre **IA, programación, arquitectura de software, herramientas para desarrolladores y hardware**, y las envía resumidas en español por Telegram.

Proyecto construido en público para documentar decisiones de arquitectura mientras amplío mi stack de Laravel/PHP a Node.js + TypeScript.

## Estado

| Versión | Qué incluye | Estado |
| --- | --- | --- |
| [v0.1](https://github.com/cemendez/radar-tech/releases/tag/v0.1) | Lectura de feeds RSS en paralelo con tolerancia a fallos | ✓ |
| v0.2 | Selección y resumen con IA (modelos open-weights en tier gratuito) | ✗ |
| v0.3 | Envío a Telegram, ejecución diaria con GitHub Actions y control de duplicados | ✗ |
| v0.4 | Ajustes basados en la operación real | ✗ |
| v1.0 | Archivo histórico y página pública en el portafolio | ✗ |

## Cómo funciona (v0.1)

1. Lee las fuentes definidas en `src/sources.ts`.
2. Descarga todos los feeds al mismo tiempo; si uno falla, los demás continúan.
3. Filtra los artículos de las últimas 30 horas y los muestra en consola agrupados por categoría.

## Requisitos

- Node.js 22 o superior
- pnpm

## Uso

```bash
pnpm install
pnpm start       # ejecuta el programa
pnpm typecheck   # verifica los tipos de TypeScript
```

## Estructura

```bash
src/
├── sources.ts # configuración: qué fuentes leer
├── feeds.ts # lógica: descarga y normalización de artículos
└── index.ts # punto de entrada
docs/adr/ # decisiones de arquitectura
```

## Decisiones de arquitectura

- [ADR-001: Script programado en lugar de un servicio](docs/adr/001-script-programado.md)

## Autor

Carlos Méndez · [carlosemendez.com](https://carlosemendez.com)
