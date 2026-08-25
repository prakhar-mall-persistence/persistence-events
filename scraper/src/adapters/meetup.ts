import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { getContext } from "../lib/browser.js";

/**
 * Meetup — Playwright over the public keyword search page for tech/AI events in the geo.
 * Meetup renders results server-side into embedded __NEXT_DATA__; we read that.
 * Defensive: any failure returns [].
 */
export const meetupAdapter: SourceAdapter = {
  key: "meetup",
  label: "Meetup",
  async fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]> {
    const ctx = await getContext();
    const page = await ctx.newPage();
    const out: NormalizedEvent[] = [];
    try {
      const q = encodeURIComponent("AI");
      const loc = encodeURIComponent(`${geo.city}, ${geo.country}`);
      await page.goto(
        `https://www.meetup.com/find/?keywords=${q}&location=${loc}&source=EVENTS`,
        { waitUntil: "domcontentloaded", timeout: 45000 }
      );
      await page.waitForTimeout(3000);

      const nextData = await page
        .locator("#__NEXT_DATA__")
        .textContent()
        .catch(() => null);
      if (!nextData) return [];
      const parsed = JSON.parse(nextData);
      const results = findEventNodes(parsed);

      for (const e of results) {
        if (!e?.id) continue;
        out.push({
          source: "meetup",
          sourceEventId: String(e.id),
          title: e.title ?? "Untitled",
          description: e.description ?? null,
          url: e.eventUrl ?? e.link ?? "https://www.meetup.com",
          startAt: e.dateTime ? new Date(e.dateTime) : null,
          endAt: e.endTime ? new Date(e.endTime) : null,
          venue: e.venue?.name ?? null,
          city: e.venue?.city ?? geo.city,
          country: geo.country,
          isOnline: e.isOnline ?? false,
          organizer: e.group?.name ?? null,
          imageUrl: e.featuredEventPhoto?.baseUrl ?? e.image?.baseUrl ?? null,
          tags: e.group?.topicCategory ? [e.group.topicCategory.name] : [],
          price: e.feeSettings?.amount ? String(e.feeSettings.amount) : "Free",
          raw: e,
        });
      }
    } catch {
      /* ignore */
    } finally {
      await page.close();
      await ctx.close();
    }
    return out;
  },
};

/** Recursively find objects that look like Meetup event nodes. */
function findEventNodes(obj: any, acc: any[] = [], depth = 0): any[] {
  if (!obj || depth > 8) return acc;
  if (Array.isArray(obj)) {
    for (const item of obj) findEventNodes(item, acc, depth + 1);
    return acc;
  }
  if (typeof obj === "object") {
    if (obj.id && obj.title && (obj.dateTime || obj.eventUrl)) acc.push(obj);
    for (const v of Object.values(obj)) findEventNodes(v, acc, depth + 1);
  }
  return acc;
}
