import { db, schema } from "@pe/shared";
import { and, gte, lte, eq, desc, sql } from "drizzle-orm";

export interface NewsletterEvent {
  id: number;
  title: string;
  url: string;
  startAt: Date | null;
  city: string | null;
  venue: string | null;
  isOnline: boolean;
  icpScore: number;
  category: string;
  reason: string | null;
}

/** Top upcoming ICP-relevant events within the horizon, above the min score. */
export async function getNewsletterEvents(opts: {
  minScore: number;
  horizonDays: number;
  max: number;
}): Promise<NewsletterEvent[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + opts.horizonDays * 86400_000);

  const rows = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      url: schema.events.url,
      startAt: schema.events.startAt,
      city: schema.events.city,
      venue: schema.events.venue,
      isOnline: schema.events.isOnline,
      icpScore: schema.eventScores.icpScore,
      category: schema.eventScores.category,
      reason: schema.eventScores.reason,
    })
    .from(schema.events)
    .innerJoin(schema.eventScores, eq(schema.eventScores.eventId, schema.events.id))
    .where(
      and(
        gte(schema.eventScores.icpScore, opts.minScore),
        gte(schema.events.startAt, now),
        lte(schema.events.startAt, horizon)
      )
    )
    .orderBy(desc(schema.eventScores.icpScore), schema.events.startAt)
    .limit(opts.max);

  return rows as NewsletterEvent[];
}
