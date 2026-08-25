import eventsJson from "../public/data/events.json";
import runsJson from "../public/data/runs.json";
import metaJson from "../public/data/meta.json";

/** EventRow as it appears after JSON round-trip (dates are ISO strings). */
export interface StaticEvent {
  id: number;
  title: string;
  url: string;
  startAt: string | null;
  endAt: string | null;
  city: string | null;
  venue: string | null;
  source: string;
  isOnline: boolean;
  organizer: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  price: string | null;
  icpScore: number | null;
  category: string | null;
  reason: string | null;
}

export interface StaticRun {
  id: number;
  runDate: string;
  status: string;
  error: string | null;
  eventCount: number;
  kitBroadcastId: string | null;
  sentAt: string | null;
}

export interface StaticMeta {
  cities: string[];
  sources: { key: string; label: string }[];
  categories: string[];
  stats: { total: number; upcoming: number; highIcp: number };
  generatedAt: string;
}

export const EVENTS = eventsJson as StaticEvent[];
export const RUNS = runsJson as StaticRun[];
export const META = metaJson as StaticMeta;
