import { db, schema } from "@pe/shared";
import { desc } from "drizzle-orm";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const runs = await db
    .select()
    .from(schema.newsletterRuns)
    .orderBy(desc(schema.newsletterRuns.sentAt))
    .limit(90);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Newsletter history</h1>
      <a
        href="/api/newsletter/preview"
        target="_blank"
        className="inline-block text-sm text-brand underline"
      >
        Preview today’s newsletter →
      </a>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Events</th>
              <th className="px-4 py-2 font-medium">Broadcast</th>
              <th className="px-4 py-2 font-medium">Sent at</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2">{r.runDate}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === "sent"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.error && <span className="text-xs text-red-500 ml-2">{r.error}</span>}
                </td>
                <td className="px-4 py-2">{r.eventCount}</td>
                <td className="px-4 py-2 text-slate-500">{r.kitBroadcastId ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{fmtDateTime(r.sentAt)}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No newsletters sent yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
