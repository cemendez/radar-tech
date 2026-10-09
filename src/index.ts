import { fetchArticles } from "./feeds";
import { buildDigest } from "./rank";
import { loadSeen, saveSeen } from "./state";
import { escapeHtml, formatDigest, sendTelegram } from "./telegram";

const WINDOW_HOURS = 30;
const DIGEST_SIZE = 10;
const TIMEZONE = "America/Mexico_City";
const DRY_RUN = process.argv.includes("--dry-run");

function dateLabel(): string {
    const label = new Intl.DateTimeFormat("es-MX", {
        timeZone: TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());
    return label.charAt(0).toUpperCase() + label.slice(1);
}

async function main(): Promise<void> {
    const started = Date.now();
    const label = dateLabel();

    const { articles, failed } = await fetchArticles(WINDOW_HOURS);
    const seen = loadSeen();
    const fresh = articles.filter((article) => !seen[article.link]);

    console.log(`Inicio: ${new Date().toISOString()}`);

    console.log(
        `${articles.length} artículos, ${fresh.length} nuevos (${failed.length} feeds con error)`,
    );
    if (failed.length > 0)
        console.log(`Feeds con error: ${failed.join(", ")}`);

    if (fresh.length === 0) {
        console.log("No hay artículos nuevos. Nada que enviar.");
        if (!DRY_RUN)
            await sendTelegram(
                `<b>Radar Tech · ${escapeHtml(label)}</b>\nHoy no hay noticias nuevas en las fuentes.`,
            );
        return;
    }

    const digest = await buildDigest(fresh, DIGEST_SIZE);
    if (digest.length === 0)
        throw new Error("El modelo no devolvió noticias válidas.");

    const messages = formatDigest(digest, label);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    if (DRY_RUN) {
        console.log(
            `\nDRY RUN: ${digest.length} noticias en ${seconds}s. Así se vería en Telegram:\n`,
        );
        messages.forEach((m, i) =>
            console.log(
                `--- mensaje ${i + 1} (${m.length} caracteres) ---\n${m}\n`,
            ),
        );
        return;
    }

    for (const message of messages) await sendTelegram(message);
    saveSeen(
        seen,
        digest.map((item) => item.link),
    );
    console.log(
        `Digest enviado (${digest.length} noticias, ${messages.length} mensaje(s), ${seconds}s)`,
    );
}

main().catch(async (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;

    if (!DRY_RUN) {
        try {
            await sendTelegram(
                `<b>Radar Tech falló hoy</b>\n<code>${escapeHtml(message.slice(0, 500))}</code>`,
            );
        } catch {
            // si Telegram también falla, solo queda el log del workflow
        }
    }
});
