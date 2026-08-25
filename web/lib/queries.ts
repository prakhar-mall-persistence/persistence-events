import { db, schema } from "@pe/shared";
import { and, gte, lte, eq, ilike, desc, asc, sql, type SQL } from "drizzle-orm";

export interface EventFilters {
  city?: string;
  source?: string;
  category?: string;
  minScore?: number;
  from?: string; // ISO date
  to?: string;
  online?: "online" | "inperson";
  q?: string;
  sort?: "score" | "date";
}

export interface EventRow {
  id: number;
  title: string;
  url: string;
  startAt: Date | null;
  endAt: Date | null;
  city: string | null;
  venue: string | null;
  source: string;
  isOnline: boolean;
  organizer: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  price: string | null;
  icpScore: number | null;
  category: string | null;
  reason: string | null;
}

export async function getEvents(filters: EventFilters, limit = 200): Promise<EventRow[]> {
  const w: SQL[] = [];
  if (filters.city) w.push(eq(schema.events.city, filters.city));
  if (filters.source) w.push(eq(schema.events.source, filters.source));
  if (filters.category) w.push(eq(schema.eventScores.category, filters.category));
  if (filters.minScore != null) w.push(gte(schema.eventScores.icpScore, filters.minScore));
  if (filters.from) w.push(gte(schema.events.startAt, new Date(filters.from)));
  if (filters.to) w.push(lte(schema.events.startAt, new Date(filters.to)));
  if (filters.online === "online") w.push(eq(schema.events.isOnline, true));
  if (filters.online === "inperson") w.push(eq(schema.events.isOnline, false));
  if (filters.q) w.push(ilike(schema.events.title, `%${filters.q}%`));

  const order =
    filters.sort === "date"
      ? asc(schema.events.startAt)
      : desc(sql`coalesce(${schema.eventScores.icpScore}, 0)`);

  const rows = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      url: schema.events.url,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      city: schema.events.city,
      venue: schema.events.venue,
      source: schema.events.source,
      isOnline: schema.events.isOnline,
      organizer: schema.events.organizer,
      imageUrl: schema.events.imageUrl,
      tags: schema.events.tags,
      price: schema.events.price,
      icpScore: schema.eventScores.icpScore,
      category: schema.eventScores.category,
      reason: schema.eventScores.reason,
    })
    .from(schema.events)
    .leftJoin(schema.eventScores, eq(schema.eventScores.eventId, schema.events.id))
    .where(w.length ? and(...w) : undefined)
    .orderBy(order)
    .limit(limit);

  return rows as EventRow[];
}

export async function getFilterOptions() {
  const cities = await db
    .selectDistinct({ city: schema.events.city })
    .from(schema.events)
    .where(sql`${schema.events.city} is not null`);
  const sources = await db.select().from(schema.sources);
  return {
    cities: cities.map((c) => c.city).filter(Boolean) as string[],
    sources: sources.map((s) => ({ key: s.key, label: s.label })),
    categories: ["AI", "tech", "founder", "investor", "community", "other"],
  };
}

export async function getStats() {
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.events);
  const [{ count: upcoming }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.events)
    .where(gte(schema.events.startAt, new Date()));
  const [{ count: highIcp }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.eventScores)
    .where(gte(schema.eventScores.icpScore, 80));
  return { total, upcoming, highIcp };
}
