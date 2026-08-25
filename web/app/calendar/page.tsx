import { getEvents } from "@/lib/queries";
import { CATEGORY_COLORS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events = await getEvents(
    { from: first.toISOString(), to: new Date(year, month + 1, 0, 23, 59).toISOString(), sort: "date" },
    500
  );

  const byDay = new Map<number, typeof events>();
  for (const e of events) {
    if (!e.startAt) continue;
    const d = new Date(e.startAt).getDate();
    (byDay.get(d) ?? byDay.set(d, []).get(d)!).push(e);
  }

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(first);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{monthLabel}</h1>
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden text-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-100 dark:bg-slate-900 p-2 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 min-h-[110px] p-1.5 align-top">
            {day && (
              <>
                <div className="text-xs text-slate-400 mb-1">{day}</div>
                <div className="space-y-1">
                  {(byDay.get(day) ?? []).slice(0, 4).map((e) => (
                    <a
                      key={e.id}
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      title={e.title}
                      className={`block truncate text-[11px] px-1.5 py-0.5 rounded ${
                        CATEGORY_COLORS[e.category ?? "other"]
                      }`}
                    >
                      {e.title}
                    </a>
                  ))}
                  {(byDay.get(day)?.length ?? 0) > 4 && (
                    <div className="text-[10px] text-slate-400">+{byDay.get(day)!.length - 4} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
