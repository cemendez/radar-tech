# ADR-002: Curaduría con un LLM open-weights en dos etapas

**Estado:** aceptado · **Fecha:** 2026-10-01

## Contexto

Cada día llegan ~35-40 artículos con mucho ruido y categorías desbalanceadas.
El presupuesto es $0 y los tiers gratuitos limitan solicitudes y tokens por minuto.

## Decisión

- Usar `gpt-oss-120b` en el tier gratuito de Groq mediante la API compatible con OpenAI, con `fetch` nativo y sin SDK de proveedor. Cambiar de proveedor es cambiar variables de entorno.
- Dividir el trabajo en dos llamadas: selección (títulos y extractos cortos) y resumen (solo las 10 elegidas).
- El modelo responde con ids; enlaces y fuentes siempre salen de los datos propios.
- Enriquecer solo las noticias elegidas que tienen un extracto pobre, descargando la descripción del artículo.

## Consecuencias

- Costo $0; cada llamada se mantiene bajo los límites del tier gratuito.
- Sin dependencia de un proveedor; respaldo configurable.
- El modelo no puede inventar enlaces.
- Algunas fuentes (como el RSS de Hacker News) no incluyen el texto del artículo; si tampoco se obtiene descripción, la noticia se muestra sin resumen.
- Dos llamadas, el enriquecimiento y una pausa de 5 s suman ~15 s (irrelevante para un proceso diario).
