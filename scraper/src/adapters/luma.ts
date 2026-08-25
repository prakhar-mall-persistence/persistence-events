import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { getContext } from "../lib/browser.js";

/**
 * Luma (lu.ma) — highest ICP value, no clean public API, so we use Playwright.
 *
 * Strategy: open the city discovery page (lu.ma/<slug>) and capture the JSON returned by
 * Luma's internal discover API (api.lu.ma/.../get-featured-items or calendar feeds), which
 * the page fetches on load. We intercept those responses instead of brittle DOM scraping.
 * Falls back to the embedded Next.js data if no API response is seen.
 *
 * This is deliberately isolated + defensive: any failure returns [] so one broken selector
 * never fails the whole scrape run.
 */
export const lumaAdapter: SourceAdapter = {
  key: "luma",
  label: "Luma",
  async fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]> {
    const slug = geo.lumaSlug ?? geo.city.toLowerCase().replace(/\s+/g, "-");
    const ctx = await getContext();
    const page = await ctx.newPage();
    const captured: any[] = [];

    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("api.lu.ma") && (url.includes("discover") || url.includes("featured") || url.includes("calendar") || url.includes("get-items"))) {
        try {
          const json = await res.json();
          captured.push(json);
        } catch {
          /* not json */
        }
      }
    });

    const out: NormalizedEvent[] = [];
    try {
      await page.goto(`https://lu.ma/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(2500);

      const entries = extractEntries(captured);
      for (const e of entries) {
        const ev = e.event ?? e;
        if (!ev?.api_id && !ev?.url) continue;
        out.push({
          source: "luma",
          sourceEventId: String(ev.api_id ?? ev.url),
          title: ev.name ?? "Untitled",
          description: ev.description_short ?? ev.description ?? null,
          url: ev.url ? (ev.url.startsWith("http") ? ev.url : `https://lu.ma/${ev.url}`) : `https://lu.ma/${slug}`,
          startAt: ev.start_at ? new Date(ev.start_at) : null,
          endAt: ev.end_at ? new Date(ev.end_at) : null,
          timezone: ev.timezone ?? null,
          venue: ev.geo_address_info?.address ?? ev.location_name ?? null,
          city: ev.geo_address_info?.city ?? geo.city,
          country: ev.geo_address_info?.country ?? geo.country,
          isOnline: !!ev.is_online || ev.location_type === "online",
          organizer: ev.hosts?.[0]?.name ?? null,
          imageUrl: ev.cover_url ?? null,
          tags: (ev.categories ?? []).map((c: any) => c.name ?? c).filter(Boolean),
          price: ev.is_free ? "Free" : null,
          raw: ev,
        });
      }
    } catch {
      /* return whatever we have */
    } finally {
      await page.close();
      await ctx.close();
    }
    return out;
  },
};

/** Walk captured JSON blobs and pull out anything that looks like an event list. */
function extractEntries(blobs: any[]): any[] {
  const entries: any[] = [];
  for (const blob of blobs) {
    const candidates = [
      blob?.entries,
      blob?.featured_items,
      blob?.items,
      blob?.events,
      blob?.data?.entries,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) entries.push(...c);
    }
  }
  return entries;
}
