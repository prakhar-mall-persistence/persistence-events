import { db, schema, type NormalizedEvent } from "@pe/shared";
import { sql } from "drizzle-orm";

/**
 * Upsert normalized events on (source, sourceEventId). Returns the ids of rows that were
 * inserted or whose content changed, so only those get (re)scored.
 */
export async function upsertEvents(events: NormalizedEvent[]): Promise<number[]> {
  const changedIds: number[] = [];
  for (const e of events) {
    if (!e.title || !e.url || !e.sourceEventId) continue;
    const row = await db
      .insert(schema.events)
      .values({
        source: e.source,
        sourceEventId: e.sourceEventId,
        title: e.title,
        description: e.description ?? null,
        url: e.url,
        startAt: e.startAt ?? null,
        endAt: e.endAt ?? null,
        timezone: e.timezone ?? null,
        venue: e.venue ?? null,
        city: e.city ?? null,
        country: e.country ?? null,
        isOnline: e.isOnline ?? false,
        organizer: e.organizer ?? null,
        imageUrl: e.imageUrl ?? null,
        tags: e.tags ?? [],
        price: e.price ?? null,
        rawJson: e.raw ?? null,
        lastSeenAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [schema.events.source, schema.events.sourceEventId],
        set: {
          title: e.title,
          description: e.description ?? null,
          startAt: e.startAt ?? null,
          endAt: e.endAt ?? null,
          venue: e.venue ?? null,
          city: e.city ?? null,
          tags: e.tags ?? [],
          price: e.price ?? null,
          imageUrl: e.imageUrl ?? null,
          lastSeenAt: sql`now()`,
        },
      })
      .returning({ id: schema.events.id });

    if (row[0]) changedIds.push(row[0].id);
  }
  return changedIds;
}
