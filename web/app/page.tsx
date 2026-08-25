import { getEvents, getFilterOptions, getStats, type EventFilters } from "@/lib/queries";
import { fmtDateTime, CATEGORY_COLORS, scoreColor } from "@/lib/format";
import Filters from "./Filters";
import ScrapeButton from "./ScrapeButton";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: EventFilters = {
    city: sp.city,
    source: sp.source,
    category: sp.category,
    minScore: sp.minScore ? Number(sp.minScore) : undefined,
    online: sp.online as EventFilters["online"],
    q: sp.q,
    sort: (sp.sort as EventFilters["sort"]) ?? "score",
  };

  const [events, options, stats] = await Promise.all([
    getEvents(filters),
    getFilterOptions(),
    getStats(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Events</h1>
        <ScrapeButton />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total events" value={stats.total} />
        <Stat label="Upcoming" value={stats.upcoming} />
        <Stat label="High ICP (≥80)" value={stats.highIcp} accent />
      </div>

      <Filters cities={options.cities} sources={options.sources} categories={options.categories} />

      <div className="text-sm text-slate-500">{events.length} events</div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <a
            key={e.id}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  CATEGORY_COLORS[e.category ?? "other"]
                }`}
              >
                {(e.category ?? "unscored").toUpperCase()}
              </span>
              <span className={`text-sm font-bold ${scoreColor(e.icpScore)}`}>
                {e.icpScore ?? "—"}
              </span>
            </div>
            <div className="font-semibold leading-snug line-clamp-2">{e.title}</div>
            <div className="text-xs text-slate-500 mt-1.5">
              {fmtDateTime(e.startAt)} · {e.isOnline ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "TBD"}
            </div>
            {e.reason && <div className="text-xs text-slate-400 mt-1.5 line-clamp-2">{e.reason}</div>}
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-2">{e.source}</div>
          </a>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          No events match. Run the scraper (GitHub Action → “Scrape events”) to populate data.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}
