import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { getContext } from "../lib/browser.js";

/**
 * Luma (lu.ma) — highest ICP value, no clean public API, so we use Playwright.
 *
 * Strategy: open the city discovery page (lu.ma/<slug>) and capture the JSON returned by
 * Luma's internal discover API (api.lu.ma/.../get-featured-items or calendar feeds), which
 * the page fetches on load. We intercept those responses instead of brittle DOM scraping.
 * Luma also renders each discovery item as schema.org/Event JSON-LD. That is our
 * dependable fallback when its private discovery endpoint changes.
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

      let entries = extractEntries(captured);
      if (entries.length === 0) entries = await extractJsonLdEvents(page);
      for (const e of entries) {
        const ev = e.event ?? e;
        if (!ev?.api_id && !ev?.url) continue;
        const location = ev.geo_address_info ?? ev.location ?? {};
        const address = location.address ?? location;
        const image = Array.isArray(ev.image) ? ev.image[0] : ev.image;
        out.push({
          source: "luma",
          sourceEventId: String(ev.api_id ?? ev.url),
          title: ev.name ?? "Untitled",
          description: ev.description_short ?? ev.description ?? null,
          url: ev.url ? (ev.url.startsWith("http") ? ev.url : `https://lu.ma/${ev.url}`) : `https://lu.ma/${slug}`,
          startAt: ev.start_at ? new Date(ev.start_at) : ev.startDate ? new Date(ev.startDate) : null,
          endAt: ev.end_at ? new Date(ev.end_at) : ev.endDate ? new Date(ev.endDate) : null,
          timezone: ev.timezone ?? null,
          venue: location.name ?? address.streetAddress ?? ev.location_name ?? null,
          city: address.addressLocality ?? location.city ?? geo.city,
          country: address.addressCountry ?? location.country ?? geo.country,
          isOnline: !!ev.is_online || ev.location_type === "online" || ev.eventAttendanceMode?.includes("Online"),
          organizer: ev.hosts?.[0]?.name ?? ev.organizer?.[0]?.name ?? ev.organizer?.name ?? null,
          imageUrl: ev.cover_url ?? image ?? null,
          tags: (ev.categories ?? []).map((c: any) => c.name ?? c).filter(Boolean),
          price: ev.is_free ? "Free" : null,
          raw: ev,
        });
      }
    } catch (error) {
      console.warn(`Luma @ ${geo.city} failed: ${(error as Error).message}`);
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

/** Read Luma's public, browser-visible Event metadata if no private API response was captured. */
async function extractJsonLdEvents(page: import("playwright").Page): Promise<any[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const events: any[] = [];
  const seen = new Set<string>();

  const visit = (value: any) => {
    if (!value || typeof value !== "object") return;
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.includes("Event")) {
      const key = value["@id"] ?? value.url ?? value.name;
      if (key && !seen.has(key)) {
        seen.add(key);
        events.push(value);
      }
      return;
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  };

  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw);
      visit(parsed);
    } catch {
      // Skip a malformed script; other events can still be collected.
    }
  }
  return events;
}
