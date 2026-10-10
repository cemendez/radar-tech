export type Validator<T> = (data: unknown) => T;

interface Provider {
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
}

function getProviders(): Provider[] {
    const { env } = process;
    const list: Provider[] = [];
    if (env.LLM_BASE_URL && env.LLM_API_KEY && env.LLM_MODEL) {
        list.push({
            name: "principal",
            baseUrl: env.LLM_BASE_URL,
            apiKey: env.LLM_API_KEY,
            model: env.LLM_MODEL,
        });
    }
    if (
        env.LLM_FALLBACK_BASE_URL &&
        env.LLM_FALLBACK_API_KEY &&
        env.LLM_FALLBACK_MODEL
    ) {
        list.push({
            name: "respaldo",
            baseUrl: env.LLM_FALLBACK_BASE_URL,
            apiKey: env.LLM_FALLBACK_API_KEY,
            model: env.LLM_FALLBACK_MODEL,
        });
    }
    if (list.length === 0)
        throw new Error(
            "Falta confiigurar LLM_BASE_URL, LLM_API_KEY y LLM_MODEL.",
        );
    return list;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function parseJsonLoose(text: string): unknown {
    const clean = text.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(clean);
    } catch {
        const start = clean.search(/[[{]/);
        const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
        if (start === -1 || end <= start)
            throw new Error(
                `La respuesta no contiene JSON: ${clean.slice(0, 200)}`,
            );
        return JSON.parse(clean.slice(start, end + 1));
    }
}

export function extractList(data: unknown, key: string): unknown[] {
    if (Array.isArray(data)) return data;
    if (data !== null && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const value = record[key];
        if (Array.isArray(value)) return value;
        const arrays = Object.values(record).filter(Array.isArray);
        if (arrays.length === 1) return arrays[0];
    }
    throw new Error(
        `Se esperaba la lista "${key}" y llegó: ${JSON.stringify(data).slice(0, 300)}`,
    );
}

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface ChatRequest {
    model: string;
    temperature: number;
    messages: ChatMessage[];
    response_format?: { type: "json_object" };
    reasoning_effort?: "low" | "medium" | "high";
}

const JSON_HINT = "Responde únicamente en formato json.";

async function callOnce(
    provider: Provider,
    system: string,
    user: string,
    strict: boolean,
): Promise<Response> {
    const body: ChatRequest = {
        model: provider.model,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content: strict ? `${system}\n${JSON_HINT}` : system,
            },
            { role: "user", content: user },
        ],
    };
    if (strict) {
        body.response_format = { type: "json_object" };
        const effort = process.env.LLM_REASONING_EFFORT;
        if (effort === "low" || effort === "medium" || effort === "high")
            body.reasoning_effort = effort;
    }
    return fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
    });
}

export async function chatJson<T>(
    system: string,
    user: string,
    validate: Validator<T>,
): Promise<T> {
    const errors: string[] = [];

    for (const provider of getProviders()) {
        let strict = true;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await callOnce(provider, system, user, strict);

                if (res.status === 429 || res.status >= 500) {
                    const retryAfter =
                        Number(res.headers.get("retry-after")) || attempt * 20;
                    console.warn(
                        `${provider.name}: HTTP ${res.status}, reintento en ${retryAfter}s`,
                    );
                    await sleep(retryAfter * 1000);
                    await res.body?.cancel();
                    continue;
                }
                if (res.status === 400 && strict) {
                    const detail = (await res.text()).slice(0, 200);
                    console.warn(
                        `${provider.name}: HTTP 400 (${detail}), reintento sin opciones avanzadas`,
                    );
                    strict = false;
                    continue;
                }
                if (!res.ok) {
                    errors.push(
                        `${provider.name}: HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
                    );
                    console.warn(`${errors.at(-1)}`);
                    break;
                }

                const data = (await res.json()) as {
                    choices?: { message?: { content?: string } }[];
                };
                const content = data.choices?.[0]?.message?.content;
                if (!content) throw new Error("Respuesta vacía del modelo");
                return validate(parseJsonLoose(content));
            } catch (err) {
                errors.push(
                    `${provider.name} (intento ${attempt}): ${(err as Error).message}`,
                );
                console.warn(`${errors.at(-1)}`);
                await sleep(3000);
            }
        }
    }

    throw new Error(`Todos los proveedores fallaron:\n${errors.join("\n")}`);
}
