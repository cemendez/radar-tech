import type { Article } from "./feeds";
import { enrich, isWeakSnippet } from "./enrich";
import { chatJson, extractList, type Validator } from "./llm";

export interface DigestItem {
    titulo: string;
    resumen: string;
    categoria: string;
    fuente: string;
    link: string;
}

type Candidate = Article & { id: string };
type RawItem = {
    id?: unknown;
    titulo?: unknown;
    resumen?: unknown;
    categoria?: unknown;
};

const NO_SUMMARY =
    "La fuente no incluye descripción; abre el enlace para leer el artículo completo.";
const normalize = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CRITERIOS = `Prioriza, en este orden:
1. Lanzamientos o versiones mayores de modelos de IA, lenguajes, frameworks, runtimes o herramientas muy usadas.
2. Cambios que afectan el trabajo diario de un desarrollador web (seguridad, deprecaciones, precios, licencias, APIs).
3. Investigación o resultados con impacto práctico demostrado, no especulativo.
4. Decisiones de arquitectura o post-mortems con lecciones aplicables.
5. Hardware relevante para desarrolladores o para la industria (CPUs, GPUs, chips de IA, servidores).

Descarta: rumores, listas tipo "top 10", ofertas, notas promocionales, opiniones sin datos,
noticias sin impacto técnico y cualquier nota repetida (si varias fuentes cubren la misma historia, elige solo una).
Busca variedad: evita que más de 4 noticias sean de la misma categoría, salvo que el día realmente lo justifique.`;

async function select(
    candidates: Candidate[],
    count: number,
): Promise<string[]> {
    const lines = candidates
        .map(
            (c) =>
                `${c.id} | ${c.source} | ${c.category} | ${c.title} | ${c.snippet.slice(0, 140)}`,
        )
        .join("\n");

    const system = `Eres el editor de un boletín técnico diario para un desarrollador web full-stack.
Tu trabajo es separar lo verdaderamente importante del ruido.
${CRITERIOS}
Responde SOLO con un objeto JSON con esta forma: {"ids": ["c3", "c17", ...]} ordenados del más al menos importante.`;

    const user = `Elige las ${count} noticias más relevantes entre estas candidatas (id | fuente | categoría | título | extracto):\n\n${lines}`;

    const valid = new Set(candidates.map((c) => c.id));

    const parseIds: Validator<string[]> = (data) => {
        const ids = extractList(data, "ids")
            .map((entry) =>
                entry !== null && typeof entry === "object"
                    ? (entry as { id?: unknown }).id
                    : entry,
            )
            .filter(
                (id): id is string => typeof id === "string" && valid.has(id),
            );
        const unique = [...new Set(ids)].slice(0, count);
        if (unique.length === 0)
            throw new Error(
                `Sin ids válidos: ${JSON.stringify(data).slice(0, 300)}`,
            );
        return unique;
    };

    return chatJson(system, user, parseIds);
}

async function summarize(chosen: Candidate[]): Promise<DigestItem[]> {
    const byId = new Map(chosen.map((c) => [c.id, c]));

    const blocks = chosen
        .map((c) => {
            const extract = isWeakSnippet(c.snippet)
                ? "(sin extracto)"
                : c.snippet;
            return `[${c.id}] Fuente: ${c.source}\nTítulo: ${c.title}\nExtracto: ${extract}`;
        })
        .join("\n\n");

    const system = `Redactas en español neutro y claro para un desarrollador web mexicano.
Para cada noticia escribe:
- "titulo": el titular en español, conciso (máximo 90 caracteres). Conserva nombres propios y de productos.
- "resumen": 2 a 3 líneas (máximo 280 caracteres) que expliquen qué pasó y por qué le importa a un desarrollador.
- "categoria": una de ia | programacion | arquitectura | herramientas | hardware.
Usa SOLO la información del extracto; no inventes cifras, fechas ni detalles.
Si el extracto dice "(sin extracto)", traduce el título al español y deja "resumen" como cadena vacía (""). Nunca repitas el título como resumen.
Si el artículo es una opinión, análisis o crítica, no lo presentes como un hecho: empieza el resumen con "Opinión:" y conserva en el título que es la postura del autor.
Responde SOLO con un objeto JSON (no un arreglo) con esta forma: {"items": [{"id": "c3", "titulo": "...", "resumen": "...", "categoria": "..."}]} en el mismo orden recibido.`;

    const minimum = Math.ceil(chosen.length / 2);

    const parseItems: Validator<DigestItem[]> = (data) => {
        const items = extractList(data, "items")
            .filter(
                (entry): entry is RawItem =>
                    entry !== null && typeof entry === "object",
            )
            .map((item) => ({
                id: String(item.id ?? ""),
                titulo: String(item.titulo ?? "").trim(),
                resumen: String(item.resumen ?? "").trim(),
                categoria: String(item.categoria ?? "").trim(),
            }))
            .filter((item) => byId.has(item.id) && item.titulo)
            .map((item) => {
                const source = byId.get(item.id)!;
                const isEcho = [item.titulo, source.title].some(
                    (t) => normalize(t) === normalize(item.resumen),
                );
                return {
                    titulo: item.titulo,
                    resumen:
                        item.resumen && !isEcho ? item.resumen : NO_SUMMARY,
                    categoria: item.categoria || source.category,
                    fuente: source.source,
                    link: source.link,
                };
            });

        if (items.length < minimum) {
            throw new Error(
                `Solo ${items.length} de ${chosen.length} noticias válidas: ${JSON.stringify(data).slice(0, 300)}`,
            );
        }
        return items;
    };

    return chatJson(system, blocks, parseItems);
}

export async function buildDigest(
    articles: Article[],
    count = 10,
): Promise<DigestItem[]> {
    const candidates: Candidate[] = articles.map((a, i) => ({
        ...a,
        id: `c${i + 1}`,
    }));

    const ids = await select(candidates, count);
    console.log(`Seleccionadas ${ids.length} noticias: ${ids.join(", ")}`);

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const chosen = await enrich(ids.map((id) => byId.get(id)!));

    await sleep(5000);
    return summarize(chosen);
}
