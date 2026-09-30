import { fetchArticles } from "./feeds";

const WINDOW_HOURS = 30;
const { articles, failed } = await fetchArticles(WINDOW_HOURS);

console.log(`${articles.length} artículos en las últimas ${WINDOW_HOURS} h`);
if (failed.length > 0) console.log(`Feeds con error: ${failed.join(", ")}`);

const perCategory = new Map<string, number>();
for (const article of articles) {
  perCategory.set(
    article.category,
    (perCategory.get(article.category) ?? 0) + 1,
  );
}
console.log("\nPor categoría:", Object.fromEntries(perCategory), "\n");

for (const article of articles.slice(0, 15)) {
  console.log(
    `[${article.category}] ${article.title}\n   ${article.source} · ${article.link}\n`,
  );
}
