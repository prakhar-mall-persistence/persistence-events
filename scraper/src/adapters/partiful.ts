import type { GeoTarget, NormalizedEvent, SourceAdapter } from "@pe/shared";

/**
 * Partiful — no public discovery/search surface (events are shared by direct link).
 * There is no reliable geo listing to scrape, so this adapter is a placeholder that returns
 * []. Kept in the registry so it appears in the dashboard's source list and can be wired up
 * later if a discovery feed or curated set of Partiful links becomes available.
 */
export const partifulAdapter: SourceAdapter = {
  key: "partiful",
  label: "Partiful",
  async fetchEvents(_geo: GeoTarget): Promise<NormalizedEvent[]> {
    return [];
  },
};
