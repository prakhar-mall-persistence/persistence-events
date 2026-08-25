import { RUNS } from "@/lib/staticData";
import { fmtDateTime } from "@/lib/format";

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Newsletter history</h1>
          <p className="mt-1 text-sm text-slate-500">Fetch fresh events first, then run the Kit newsletter when you are ready to send.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://github.com/prakhar-mall-persistence/persistence-events/actions/workflows/scrape.yml"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            Fetch new events
          </a>
          <a
            href="https://github.com/prakhar-mall-persistence/persistence-events/actions/workflows/newsletter.yml"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Run Kit workflow
          </a>
        </div>
      </div>
      <p className="text-xs text-slate-400">The buttons open the secured GitHub Actions workflow. Choose “Run workflow” there; this keeps database and Kit credentials out of the public dashboard.</p>
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
            {RUNS.map((r) => (
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
            {RUNS.length === 0 && (
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
