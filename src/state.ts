import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STATE_FILE = "state/seen.json";
const KEEP_DAYS = 10;

type Seen = Record<string, string>; // enlace → fecha ISO en que se envió

export function loadSeen(): Seen {
    if (!existsSync(STATE_FILE)) return {};
    try {
        return JSON.parse(readFileSync(STATE_FILE, "utf8")) as Seen;
    } catch {
        console.warn("state/seen.json está dañado; se reinicia.");
        return {};
    }
}

export function saveSeen(seen: Seen, newLinks: string[]): void {
    const now = new Date();
    const cutoff = now.getTime() - KEEP_DAYS * 86_400_000;

    const next: Seen = {};
    for (const [link, date] of Object.entries(seen)) {
        if (new Date(date).getTime() >= cutoff) next[link] = date;
    }
    for (const link of newLinks) next[link] = now.toISOString();

    mkdirSync(dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, `${JSON.stringify(next, null, 2)}\n`);
}
