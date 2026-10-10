import { cleanText, type Article } from "./feeds";

const WEAK_MIN_LENGTH = 120;

export function isWeakSnippet(snippet: string): boolean {
    return (
        snippet.length < WEAK_MIN_LENGTH || snippet.startsWith("Article URL:")
    );
}

function extractMeta(html: string, key: string): string | undefined {
    const pattern = new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`,
        "i",
    );
    const tag = html.match(pattern)?.[0];
    return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

async function fetchDescription(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: { "User-Agent": "RadarTech/0.2 (+https://carlosemendez.com)" },
        signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
    }

    const html = (await res.text()).slice(0, 200_000);
    const description =
        extractMeta(html, "og:description") ??
        extractMeta(html, "description") ??
        extractMeta(html, "twitter:description") ??
        html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];

    return cleanText(description, 700);
}

function isUseful(description: string, title: string): boolean {
    const normalize = (text: string) =>
        text.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
        description.length >= 60 && normalize(description) !== normalize(title)
    );
}

export async function enrich<T extends Article>(articles: T[]): Promise<T[]> {
    return Promise.all(
        articles.map(async (article) => {
            if (!isWeakSnippet(article.snippet)) return article;
            try {
                const snippet = await fetchDescription(article.link);
                if (!isUseful(snippet, article.title)) {
                    console.log(`Sin descripción útil: ${article.link}`);
                    return article;
                }
                console.log(`Enriquecida: ${article.title.slice(0, 60)}`);
                return { ...article, snippet };
            } catch (err) {
                console.log(
                    `No se pudo enriquecer (${(err as Error).message}): ${article.link}`,
                );
                return article;
            }
        }),
    );
}
