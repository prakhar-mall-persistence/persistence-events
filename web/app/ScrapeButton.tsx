"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { triggerScrape } from "./actions";

export default function ScrapeButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(true);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await triggerScrape();
            setOk(r.ok);
            setMsg(r.message);
            if (r.ok) setTimeout(() => router.refresh(), 4000);
          })
        }
        className="rounded-md bg-brand text-white px-3.5 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Scrape now"}
      </button>
      {msg && (
        <span className={`text-xs ${ok ? "text-emerald-600" : "text-amber-600"}`}>{msg}</span>
      )}
    </div>
  );
}
