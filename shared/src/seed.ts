import "dotenv/config";
import { db } from "./db.js";
import { geographies, sources, settings } from "./schema.js";
import { sql } from "drizzle-orm";

/** Seed initial geography (Bengaluru), source toggles, and default settings. */
async function main() {
  console.log("Seeding geographies…");
  await db
    .insert(geographies)
    .values({
      city: "Bengaluru",
      country: "India",
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 50,
      lumaSlug: "bengaluru",
      enabled: true,
    })
    .onConflictDoNothing({ target: [geographies.city, geographies.country] });

  console.log("Seeding sources…");
  const srcRows = [
    { key: "confstech", label: "Confs.tech" },
    { key: "eventbrite", label: "Eventbrite" },
    { key: "tentimes", label: "10times" },
    { key: "luma", label: "Luma" },
    { key: "meetup", label: "Meetup" },
    { key: "partiful", label: "Partiful" },
  ];
  for (const s of srcRows) {
    await db.insert(sources).values({ ...s, enabled: true }).onConflictDoNothing();
  }

  console.log("Seeding settings…");
  const defaults: Record<string, string> = {
    newsletter_send_time_ist: "10:15",
    newsletter_min_icp_score: "60",
    newsletter_horizon_days: "30",
    newsletter_max_events: "25",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: sql`now()` } });
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
