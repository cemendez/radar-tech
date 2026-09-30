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

export async function fetchArticles(windowHours: number) {
  const since = Date.now() - windowHours * 3_600_000;

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return feed.items
        .filter((item) => item.title && item.link)
        .map((item) => ({
          title: cleanText(item.title, 200),
          link: item.link!,
          source: source.name,
          category: source.category,
          published: new Date(item.isDate ?? item.pubDate ?? ""),
          snippet: cleanText(item.contentSnippet ?? item.content, 700),
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

  return { articles, failed };
}
