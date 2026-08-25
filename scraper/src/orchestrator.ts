import { db, schema, type GeoTarget } from "@pe/shared";
import { eq, sql } from "drizzle-orm";
import { ADAPTERS } from "./adapters/index.js";
import { upsertEvents } from "./upsert.js";
import { scoreEvents } from "./scorer.js";
import { closeBrowser } from "./lib/browser.js";

/**
 * Full scrape run: for every enabled source × enabled geography, fetch → upsert → score.
 * Each adapter is wrapped so a failure degrades that one source without failing the run,
 * and updates the `sources` row for the dashboard's health view.
 */
export async function runScrape(): Promise<void> {
  const geos = (await db
    .select()
    .from(schema.geographies)
    .where(eq(schema.geographies.enabled, true))) as unknown as GeoTarget[];

  const enabledSources = await db
    .select()
    .from(schema.sources)
    .where(eq(schema.sources.enabled, true));

  if (geos.length === 0) console.warn("No enabled geographies — nothing to scrape.");

  const allChangedIds: number[] = [];

  for (const src of enabledSources) {
    const adapter = ADAPTERS[src.key];
    if (!adapter) continue;
    let count = 0;
    let status: "ok" | "error" = "ok";
    let errMsg: string | null = null;

    try {
      for (const geo of geos) {
        try {
          const events = await adapter.fetchEvents(geo);
          const ids = await upsertEvents(events);
          allChangedIds.push(...ids);
          count += events.length;
          console.log(`  ${src.key} @ ${geo.city}: ${events.length} events`);
        } catch (geoErr) {
          console.error(`  ${src.key} @ ${geo.city} failed:`, (geoErr as Error).message);
        }
      }
    } catch (err) {
      status = "error";
      errMsg = (err as Error).message;
      console.error(`Source ${src.key} failed:`, errMsg);
    }

    await db
      .update(schema.sources)
      .set({ lastRunAt: sql`now()`, lastStatus: status, lastError: errMsg, lastCount: count })
      .where(eq(schema.sources.key, src.key));
  }

  await closeBrowser();

  // Score this run's new/changed events PLUS any event still missing a score (self-healing
  // if a prior scoring batch failed). scoreEvents skips events whose content hash is current.
  const unscored = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .leftJoin(schema.eventScores, eq(schema.eventScores.eventId, schema.events.id))
    .where(sql`${schema.eventScores.eventId} is null`);
  const toScore = dedupe([...allChangedIds, ...unscored.map((r) => r.id)]);

  console.log(`Scoring ${toScore.length} events (${allChangedIds.length} changed, ${unscored.length} unscored)…`);
  const scored = await scoreEvents(toScore);
  console.log(`Scored ${scored} events. Scrape run complete.`);
}

const dedupe = (ids: number[]) => Array.from(new Set(ids));
