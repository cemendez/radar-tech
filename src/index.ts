import { fetchArticles } from "./feeds";
import { buildDigest } from "./rank";

const WINDOW_HOURS = 30;
const DIGEST_SIZE = 10;

async function main(): Promise<void> {
    const started = Date.now();
    const { articles, failed } = await fetchArticles(WINDOW_HOURS);

    console.log(
        `${articles.length} artículos en las últimas ${WINDOW_HOURS} h`,
    );
    if (failed.length > 0) console.log(`Feeds con error: ${failed.join(", ")}`);

    if (articles.length === 0) {
        console.log("No hay artículos nuevos. Nada que resumir.");
        return;
    }

    const digest = await buildDigest(articles, DIGEST_SIZE);
    if (digest.length === 0)
        throw new Error("El modelo no devolvió noticias válidas.");
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    console.log(
        `\n Radar Tech — ${digest.length} noticias seleccionadas en ${seconds}s\n`,
    );
    digest.forEach((item, i) => {
        console.log(`${i + 1}. [${item.categoria}] ${item.titulo}`);
        console.log(`   ${item.resumen}`);
        console.log(`   ${item.fuente} · ${item.link}\n`);
    });
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
});
