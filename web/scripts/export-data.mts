import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { desc } from "drizzle-orm";
import { db, schema } from "@pe/shared";
import { getEvents, getFilterOptions, getStats } from "../lib/queries.js";

/**
 * Bakes the data the static dashboard needs into web/public/data/*.json.
 * Run before `next build`; the pages import these files at build time.
 */
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "data");
await mkdir(outDir, { recursive: true });

const [events, options, stats] = await Promise.all([
  getEvents({ sort: "score" }, 1000),
  getFilterOptions(),
  getStats(),
]);

const runs = await db
  .select()
  .from(schema.newsletterRuns)
  .orderBy(desc(schema.newsletterRuns.sentAt))
  .limit(90);

await writeFile(path.join(outDir, "events.json"), JSON.stringify(events));
await writeFile(path.join(outDir, "runs.json"), JSON.stringify(runs));
await writeFile(
  path.join(outDir, "meta.json"),
  JSON.stringify({ ...options, stats, generatedAt: new Date().toISOString() })
);

console.log(`Exported ${events.length} events, ${runs.length} newsletter runs → ${outDir}`);
process.exit(0);
