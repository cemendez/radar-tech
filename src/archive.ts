import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ArchivedItem {
    title: string;
    url: string;
    summary: string;
    source?: string;
}

export interface ArchivedDigest {
    date: string; // YYYY-MM-DD
    items: ArchivedItem[];
}

const DIR = "archive";

export function todayPuebla(now = new Date()): string {
    // en-CA formatea como YYYY-MM-DD; fijamos zona para que no dependa del runner (UTC)
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Mexico_City",
    }).format(now);
}

function toMarkdown(d: ArchivedDigest): string {
    const body = d.items
        .map(
            (it, i) =>
                `${i + 1}. **[${it.title}](${it.url})**\n   ${it.summary}`,
        )
        .join("\n\n");
    return `# Radar Tech · ${d.date}\n\n${body}\n`;
}

export async function archiveDigest(d: ArchivedDigest): Promise<void> {
    await mkdir(DIR, { recursive: true });
    await writeFile(join(DIR, `${d.date}.json`), JSON.stringify(d, null, 2));
    await writeFile(join(DIR, `${d.date}.md`), toMarkdown(d));

    // índice: lista de fechas, más reciente primero, sin duplicados
    const indexPath = join(DIR, "index.json");
    let dates: string[] = [];
    try {
        dates = JSON.parse(await readFile(indexPath, "utf8")) as string[];
    } catch {
        // primera ejecución: no existe aún
    }
    const next = [...new Set([d.date, ...dates])].sort().reverse();
    await writeFile(indexPath, JSON.stringify(next, null, 2));
}
