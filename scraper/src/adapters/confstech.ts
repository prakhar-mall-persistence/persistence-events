import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";
import { politeFetch } from "../lib/http.js";

/**
 * Confs.tech — open dataset of developer/tech conferences.
 * Data source: github.com/tech-conferences/conference-data (raw JSON per topic/year).
 * No scraping, no auth. We pull ICP-relevant topics for this + next year and
 * filter loosely by the geography's country/city.
 */
const TOPICS = [
  "general",
  "ai",
  "machinelearning",
  "data",
  "javascript",
  "python",
  "devops",
  "product",
  "ux",
  "clojure",
];

const RAW = (year: number, topic: string) =>
  `https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/${year}/${topic}.json`;

interface ConfEntry {
  name: string;
  url: string;
  startDate: string;
  endDate?: string;
  city?: string;
  country?: string;
  online?: boolean;
  cfpUrl?: string;
  twitter?: string;
}

export const confstechAdapter: SourceAdapter = {
  key: "confstech",
  label: "Confs.tech",
  async fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]> {
    const now = new Date();
    const years = [now.getFullYear(), now.getFullYear() + 1];
    const out: NormalizedEvent[] = [];
    const seen = new Set<string>();

    for (const year of years) {
      for (const topic of TOPICS) {
        try {
          const res = await politeFetch(RAW(year, topic));
          if (!res.ok) continue;
          const list = (await res.json()) as ConfEntry[];
          for (const c of list) {
            const matchesGeo =
              c.online ||
              (c.country && geo.country && c.country.toLowerCase() === geo.country.toLowerCase()) ||
              (c.city && c.city.toLowerCase() === geo.city.toLowerCase());
            if (!matchesGeo) continue;

            const id = `${c.name}|${c.startDate}`.toLowerCase().replace(/\s+/g, "-");
            if (seen.has(id)) continue;
            seen.add(id);

            out.push({
              source: "confstech",
              sourceEventId: id,
              title: c.name,
              description: c.cfpUrl ? `CFP: ${c.cfpUrl}` : null,
              url: c.url,
              startAt: c.startDate ? new Date(c.startDate) : null,
              endAt: c.endDate ? new Date(c.endDate) : null,
              city: c.city ?? null,
              country: c.country ?? null,
              isOnline: !!c.online,
              tags: [topic],
              raw: c,
            });
          }
        } catch {
          // skip missing topic/year file
        }
      }
    }
    return out;
  },
};
