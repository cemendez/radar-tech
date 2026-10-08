import Parser from "rss-parser";
import { SOURCES, type Category } from "./sources";

export interface Article {
    title: string;
    link: string;
    source: string;
    category: Category;
    published: Date;
    snippet: string;
}

const parser = new Parser({
    timeout: 15_000,
    headers: { "User-Agent": "RadarTech/0.1 (+https://carlosemendez.com)" },
});

export function cleanText(html: string | undefined, max: number): string {
    if (!html) return "";
    const text = html
        .replace(/<[^]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

const TRACKING_PARAM = /^(utm_|ref$|source$|fbclid|gclid)/i;

export function normalizeUrl(url: string): string {
    try {
        const u = new URL(url);
        u.hash = "";
        u.pathname = u.pathname.replace(/\/+$/, "") || "/";
        for (const key of [...u.searchParams.keys()]) {
            if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
        }
        return u.toString();
    } catch {
        return url;
    }
}

export async function fetchArticles(windowHours: number) {
    const since = Date.now() - windowHours * 3_600_000;

    const results = await Promise.allSettled(
        SOURCES.map(async (source) => {
            const feed = await parser.parseURL(source.url);
            return feed.items
                .filter((item) => item.title && item.link)
                .map((item) => ({
                    title: cleanText(item.title, 200),
                    link: normalizeUrl(item.link!),
                    source: source.name,
                    category: source.category,
                    published: new Date(item.isDate ?? item.pubDate ?? ""),
                    snippet: cleanText(
                        item.contentSnippet ?? item.content,
                        700,
                    ),
                }))
                .filter((article) => article.published.getTime() >= since)
                .sort((a, b) => b.published.getTime() - a.published.getTime())
                .slice(0, source.maxItems ?? 10);
        }),
    );

    const articles: Article[] = [];
    const failed: string[] = [];
    results.forEach((result, i) => {
        if (result.status === "fulfilled") articles.push(...result.value);
        else failed.push(SOURCES[i].name);
    });

    const seenLinks = new Set<string>();
    const seenTitles = new Set<string>();
    const unique = articles.filter((article) => {
        const titleKey = article.title
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúñ]/g, "");
        if (seenLinks.has(article.link) || seenTitles.has(titleKey))
            return false;
        seenLinks.add(article.link);
        seenTitles.add(titleKey);
        return true;
    });

    return { articles: unique, failed };
}
