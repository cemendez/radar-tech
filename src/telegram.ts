import type { DigestItem } from "./rank";

const LIMIT = 4000; // Telegram permite 4096 caracteres por mensaje; dejamos margen

const EMOJI: Record<string, string> = {
    ia: "🤖",
    programacion: "💻",
    arquitectura: "🏛️",
    herramientas: "🛠️",
    hardware: "🔌",
};

export const escapeHtml = (text: string) =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

export function formatDigest(items: DigestItem[], dateLabel: string): string[] {
    const header = `<b>Radar Tech · ${escapeHtml(dateLabel)}</b>\nLo más relevante de las últimas horas`;

    const blocks = items.map((item, i) => {
        const emoji = EMOJI[item.categoria] ?? "📰";
        return [
            `${i + 1}. ${emoji} <b>${escapeHtml(item.titulo)}</b>`,
            escapeHtml(item.resumen),
            `<a href="${escapeHtml(item.link)}">${escapeHtml(item.fuente)} →</a>`,
        ].join("\n");
    });

    const messages: string[] = [];
    let current = header;
    for (const block of blocks) {
        if (`${current}\n\n${block}`.length > LIMIT) {
            messages.push(current);
            current = block;
        } else {
            current += `\n\n${block}`;
        }
    }
    messages.push(current);
    return messages;
}

export async function sendTelegram(text: string): Promise<void> {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId)
        throw new Error("Falta TELEGRAM_TOKEN o TELEGRAM_CHAT_ID.");

    const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                link_preview_options: { is_disabled: true },
            }),
        },
    );
    if (!res.ok)
        throw new Error(
            `Telegram HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
}
