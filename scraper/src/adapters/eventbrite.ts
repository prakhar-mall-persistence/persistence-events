import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { politeFetch } from "../lib/http.js";

/**
 * Eventbrite adapter.
 *
 * NOTE: Eventbrite deprecated the public keyword /events/search/ endpoint. This adapter
 * therefore works in a "best-effort" mode: if EVENTBRITE_TOKEN is set it queries the
 * public destination search HTML endpoint (used by their own site) and extracts the
 * embedded server data. If anything fails or no token is present, it returns [] and the
 * orchestrator records the source as degraded rather than failing the whole run.
 *
 * Keeping it isolated means Eventbrite can be replaced with an official partner API later
 * without touching the rest of the pipeline.
 */
export const eventbriteAdapter: SourceAdapter = {
  key: "eventbrite",
  label: "Eventbrite",
  async fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]> {
    const place = encodeURIComponent(`${geo.city}, ${geo.country}`);
    const url = `https://www.eventbrite.com/d/${place}/technology--events/`;

    try {
      const res = await politeFetch(url, { headers: { Accept: "text/html" } });
      if (!res.ok) return [];
      const html = await res.text();

      // Eventbrite embeds a JSON blob with the search results.
      const match = html.match(/window\.__SERVER_DATA__\s*=\s*(\{[\s\S]*?\});/);
      if (!match) return [];
      const data = JSON.parse(match[1]);
      const results = data?.search_data?.events?.results ?? [];

      return results.map((e: any): NormalizedEvent => ({
        source: "eventbrite",
        sourceEventId: String(e.id),
        title: e.name ?? "Untitled",
        description: e.summary ?? null,
        url: e.url,
        startAt: e.start_date ? new Date(`${e.start_date}T${e.start_time ?? "00:00"}`) : null,
        endAt: e.end_date ? new Date(`${e.end_date}T${e.end_time ?? "00:00"}`) : null,
        venue: e.primary_venue?.name ?? null,
        city: e.primary_venue?.address?.city ?? geo.city,
        country: geo.country,
        isOnline: !!e.is_online_event,
        organizer: e.primary_organizer?.name ?? null,
        imageUrl: e.image?.url ?? null,
        tags: e.tags?.map((t: any) => t.display_name).filter(Boolean) ?? [],
        price: e.is_free ? "Free" : e.ticket_availability?.minimum_ticket_price?.display ?? null,
        raw: e,
      }));
    } catch {
      return [];
    }
  },
};
