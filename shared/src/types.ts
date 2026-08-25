/** Normalized event shape every scraper adapter must return. */
export interface NormalizedEvent {
  source: string;
  sourceEventId: string;
  title: string;
  description?: string | null;
  url: string;
  startAt?: Date | null;
  endAt?: Date | null;
  timezone?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  isOnline?: boolean;
  organizer?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  price?: string | null;
  raw?: unknown;
}

export interface GeoTarget {
  id: number;
  city: string;
  country: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm: number;
  lumaSlug?: string | null;
}

/** Contract for a source adapter. */
export interface SourceAdapter {
  key: string;
  label: string;
  fetchEvents(geo: GeoTarget): Promise<NormalizedEvent[]>;
}

export type IcpCategory = "AI" | "tech" | "founder" | "investor" | "community" | "other";

export interface IcpResult {
  icpScore: number; // 0-100
  category: IcpCategory;
  reason: string;
}
