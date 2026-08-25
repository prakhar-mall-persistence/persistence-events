export function fmtDateTime(d: Date | string | null): string {
  if (!d) return "Date TBD";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  tech: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  founder: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  investor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  community: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function scoreColor(score: number | null): string {
  if (score == null) return "text-slate-400";
  if (score >= 80) return "text-violet-600 dark:text-violet-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  return "text-slate-500";
}
