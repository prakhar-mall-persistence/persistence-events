import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  doublePrecision,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Raw + normalized events scraped from every source.
 * Deduped on (source, sourceEventId) so re-runs upsert instead of duplicating.
 */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(), // e.g. "luma", "eventbrite", "confstech"
    sourceEventId: text("source_event_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    timezone: text("timezone"),
    venue: text("venue"),
    city: text("city"),
    country: text("country"),
    isOnline: boolean("is_online").default(false).notNull(),
    organizer: text("organizer"),
    imageUrl: text("image_url"),
    tags: text("tags").array(),
    price: text("price"),
    rawJson: jsonb("raw_json"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    srcUniq: uniqueIndex("events_source_uniq").on(t.source, t.sourceEventId),
    startIdx: index("events_start_idx").on(t.startAt),
    cityIdx: index("events_city_idx").on(t.city),
  })
);

/**
 * LLM ICP relevance score per event. One row per event (latest score);
 * re-scored only when content hash changes.
 */
export const eventScores = pgTable(
  "event_scores",
  {
    eventId: integer("event_id")
      .primaryKey()
      .references(() => events.id, { onDelete: "cascade" }),
    icpScore: integer("icp_score").notNull(), // 0-100
    category: text("category").notNull(), // AI | tech | founder | investor | community | other
    reason: text("reason"),
    contentHash: text("content_hash").notNull(),
    model: text("model"),
    scoredAt: timestamp("scored_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    scoreIdx: index("event_scores_score_idx").on(t.icpScore),
  })
);

/** Configurable geographies the scraper targets. */
export const geographies = pgTable(
  "geographies",
  {
    id: serial("id").primaryKey(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    radiusKm: integer("radius_km").default(50).notNull(),
    lumaSlug: text("luma_slug"), // e.g. "bengaluru" for lu.ma/bengaluru
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    cityUniq: uniqueIndex("geographies_city_country_uniq").on(t.city, t.country),
  })
);

/** Per-platform source toggles + health. */
export const sources = pgTable("sources", {
  key: text("key").primaryKey(), // "luma", "eventbrite", ...
  label: text("label").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastStatus: text("last_status"), // ok | error
  lastError: text("last_error"),
  lastCount: integer("last_count"),
});

/** Generic key/value app settings. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Audit log of newsletter sends. */
export const newsletterRuns = pgTable("newsletter_runs", {
  id: serial("id").primaryKey(),
  runDate: text("run_date").notNull(), // YYYY-MM-DD (IST)
  status: text("status").notNull(), // sent | dry-run | error
  eventCount: integer("event_count").default(0).notNull(),
  kitBroadcastId: text("kit_broadcast_id"),
  error: text("error"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventScore = typeof eventScores.$inferSelect;
export type Geography = typeof geographies.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type NewsletterRun = typeof newsletterRuns.$inferSelect;
