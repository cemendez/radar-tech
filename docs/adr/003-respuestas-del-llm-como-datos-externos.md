# ADR-003: Las respuestas del LLM se tratan como datos externos no confiables

**Estado:** aceptado · **Fecha:** 2026-10-01

## Contexto
En las primeras ejecuciones, el modelo respondió de formas distintas a la misma instrucción:
un arreglo en lugar de un objeto, otro nombre de propiedad, resúmenes inventados a partir
del título y una respuesta inservible que produjo un digest vacío sin ningún error.

## Decisión

- `chatJson` devuelve `unknown` y recibe una función de validación de cada etapa.
- La validación ocurre dentro del ciclo de reintentos: un formato incorrecto se reintenta igual que un error de red.
- Cada respuesta se normaliza primero y se valida después; si menos de la mitad de las noticias son válidas, se considera un fallo.
- Los textos que el código puede generar de forma determinista (como el aviso de "sin descripción") no se delegan al modelo.
- Un resultado vacío siempre termina en error, nunca en una ejecución "exitosa".

## Consecuencias

- Los tipos de TypeScript están respaldados por comprobaciones reales, no por `as`.
- Los errores de formato se recuperan solos en la mayoría de los casos.
- Los logs muestran el contenido real que causó un fallo.
- Más código de validación que en una integración ingenua con la API.
