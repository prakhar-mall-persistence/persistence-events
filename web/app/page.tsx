"use client";

import { useMemo, useState } from "react";
import { EVENTS, META, type StaticEvent } from "@/lib/staticData";
import { fmtDateTime, CATEGORY_COLORS, scoreColor } from "@/lib/format";

interface Filters {
  city: string;
  source: string;
  category: string;
  minScore: string;
  online: string;
  q: string;
  sort: "score" | "date";
}

const EMPTY: Filters = { city: "", source: "", category: "", minScore: "", online: "", q: "", sort: "score" };

export default function Dashboard() {
  const [f, setF] = useState<Filters>(EMPTY);
  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));

  const events = useMemo(() => {
    let rows = EVENTS.filter((e) => {
      if (f.city && e.city !== f.city) return false;
      if (f.source && e.source !== f.source) return false;
      if (f.category && e.category !== f.category) return false;
      if (f.minScore && (e.icpScore ?? -1) < Number(f.minScore)) return false;
      if (f.online === "online" && !e.isOnline) return false;
      if (f.online === "inperson" && e.isOnline) return false;
      if (f.q && !e.title.toLowerCase().includes(f.q.toLowerCase())) return false;
      return true;
    });
    if (f.sort === "date") {
      rows = [...rows].sort((a, b) => (a.startAt ?? "9999").localeCompare(b.startAt ?? "9999"));
    }
    return rows;
  }, [f]);

  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY);
  const sel =
    "rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Events</h1>
        <span className="text-xs text-slate-400">Data as of {fmtDateTime(META.generatedAt)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total events" value={META.stats.total} />
        <Stat label="Upcoming" value={META.stats.upcoming} />
        <Stat label="High ICP (≥80)" value={META.stats.highIcp} accent />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className={sel + " min-w-[180px]"}
          placeholder="Search title…"
          value={f.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <select className={sel} value={f.city} onChange={(e) => set({ city: e.target.value })}>
          <option value="">All cities</option>
          {META.cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={sel} value={f.source} onChange={(e) => set({ source: e.target.value })}>
          <option value="">All sources</option>
          {META.sources.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select className={sel} value={f.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>
          {META.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={sel} value={f.minScore} onChange={(e) => set({ minScore: e.target.value })}>
          <option value="">Any ICP score</option>
          <option value="80">ICP ≥ 80</option>
          <option value="60">ICP ≥ 60</option>
          <option value="40">ICP ≥ 40</option>
        </select>
        <select className={sel} value={f.online} onChange={(e) => set({ online: e.target.value })}>
          <option value="">Any format</option>
          <option value="inperson">In person</option>
          <option value="online">Online</option>
        </select>
        <select className={sel} value={f.sort} onChange={(e) => set({ sort: e.target.value as Filters["sort"] })}>
          <option value="score">Sort: ICP score</option>
          <option value="date">Sort: date</option>
        </select>
        {dirty && (
          <button className={sel + " text-slate-500"} onClick={() => setF(EMPTY)}>
            Clear
          </button>
        )}
      </div>

      <div className="text-sm text-slate-500">{events.length} events</div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <EventCard key={e.id} e={e} />
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

function EventCard({ e }: { e: StaticEvent }) {
  return (
    <a
      href={e.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[e.category ?? "other"]}`}
        >
          {(e.category ?? "unscored").toUpperCase()}
        </span>
        <span className={`text-sm font-bold ${scoreColor(e.icpScore)}`}>{e.icpScore ?? "—"}</span>
      </div>
      <div className="font-semibold leading-snug line-clamp-2">{e.title}</div>
      <div className="text-xs text-slate-500 mt-1.5">
        {fmtDateTime(e.startAt)} · {e.isOnline ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "TBD"}
      </div>
      {e.reason && <div className="text-xs text-slate-400 mt-1.5 line-clamp-2">{e.reason}</div>}
      <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-2">{e.source}</div>
    </a>
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
