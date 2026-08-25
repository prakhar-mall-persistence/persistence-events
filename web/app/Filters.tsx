"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  cities: string[];
  sources: { key: string; label: string }[];
  categories: string[];
}

export default function Filters({ cities, sources, categories }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/?${next.toString()}`);
    },
    [params, router]
  );

  const sel =
    "rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        className={sel + " min-w-[180px]"}
        placeholder="Search title…"
        defaultValue={params.get("q") ?? ""}
        onKeyDown={(e) => e.key === "Enter" && set("q", (e.target as HTMLInputElement).value)}
      />
      <select className={sel} value={params.get("city") ?? ""} onChange={(e) => set("city", e.target.value)}>
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className={sel} value={params.get("source") ?? ""} onChange={(e) => set("source", e.target.value)}>
        <option value="">All sources</option>
        {sources.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
      <select className={sel} value={params.get("category") ?? ""} onChange={(e) => set("category", e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className={sel} value={params.get("minScore") ?? ""} onChange={(e) => set("minScore", e.target.value)}>
        <option value="">Any ICP score</option>
        <option value="80">ICP ≥ 80</option>
        <option value="60">ICP ≥ 60</option>
        <option value="40">ICP ≥ 40</option>
      </select>
      <select className={sel} value={params.get("online") ?? ""} onChange={(e) => set("online", e.target.value)}>
        <option value="">Any format</option>
        <option value="inperson">In person</option>
        <option value="online">Online</option>
      </select>
      <select className={sel} value={params.get("sort") ?? "score"} onChange={(e) => set("sort", e.target.value)}>
        <option value="score">Sort: ICP score</option>
        <option value="date">Sort: date</option>
      </select>
      {params.toString() && (
        <button className={sel + " text-slate-500"} onClick={() => router.push("/")}>
          Clear
        </button>
      )}
    </div>
  );
}
