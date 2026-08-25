import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { getContext } from "../lib/browser.js";

/**
 * 10times.com — global conference directory. City pages list upcoming business/tech confs.
 * Playwright reads the listing; JSON-LD (schema.org/Event) is embedded per card.
 * Defensive: any failure returns [].
 */
export const tentimesAdapter: SourceAdapter = {
  key: "tentimes",
  label: "10times",
  async fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]> {
    const ctx = await getContext();
    const page = await ctx.newPage();
    const out: NormalizedEvent[] = [];
    try {
      const city = geo.city.toLowerCase().replace(/\s+/g, "-");
      await page.goto(`https://10times.com/${city}/technology`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(2500);

      const jsonLdBlocks = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents()
        .catch(() => [] as string[]);

      for (const block of jsonLdBlocks) {
        try {
          const parsed = JSON.parse(block);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of arr) {
            if (item["@type"] !== "Event") continue;
            out.push({
              source: "tentimes",
              sourceEventId: (item.url ?? item.name)?.toString(),
              title: item.name,
              description: item.description ?? null,
              url: item.url,
              startAt: item.startDate ? new Date(item.startDate) : null,
              endAt: item.endDate ? new Date(item.endDate) : null,
              venue: item.location?.name ?? null,
              city: item.location?.address?.addressLocality ?? geo.city,
              country: item.location?.address?.addressCountry ?? geo.country,
              isOnline: item.eventAttendanceMode?.includes("Online") ?? false,
              organizer: item.organizer?.name ?? null,
              imageUrl: typeof item.image === "string" ? item.image : item.image?.[0] ?? null,
              raw: item,
            });
          }
        } catch {
          /* skip bad block */
        }
      }
    } catch {
      /* ignore */
    } finally {
      await page.close();
      await ctx.close();
    }
    return out.filter((e) => e.sourceEventId);
  },
};
