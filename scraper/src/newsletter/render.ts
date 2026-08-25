import type { NewsletterEvent } from "./query.js";

const CAT_COLOR: Record<string, string> = {
  AI: "#7c3aed",
  tech: "#2563eb",
  founder: "#059669",
  investor: "#d97706",
  community: "#db2777",
  other: "#64748b",
};

function fmtDate(d: Date | null): string {
  if (!d) return "TBD";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Render the daily newsletter HTML. Grouped by city, sorted by ICP score, CTA at bottom. */
export function renderNewsletter(events: NewsletterEvent[], dashboardUrl: string): string {
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const byCity = new Map<string, NewsletterEvent[]>();
  for (const e of events) {
    const key = e.isOnline ? "Online" : e.city ?? "Other";
    (byCity.get(key) ?? byCity.set(key, []).get(key)!).push(e);
  }

  const sections = [...byCity.entries()]
    .map(
      ([city, list]) => `
    <tr><td style="padding:24px 0 8px;font:600 13px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748b;">${esc(city)}</td></tr>
    ${list.map((e) => renderCard(e)).join("")}`
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr><td style="padding:28px 32px 4px;">
          <div style="font:700 22px/1.2 -apple-system,Segoe UI,sans-serif;color:#0f172a;">Persistence Events Daily</div>
          <div style="font:400 14px/1.4 -apple-system,Segoe UI,sans-serif;color:#64748b;margin-top:4px;">${esc(dateLabel)} · ${events.length} events matched to your ICP</div>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sections || emptyState()}</table>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;" align="center">
          <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font:600 15px/1 -apple-system,Segoe UI,sans-serif;padding:14px 28px;border-radius:10px;">Open the full dashboard →</a>
          <div style="font:400 12px/1.4 -apple-system,Segoe UI,sans-serif;color:#94a3b8;margin-top:16px;">Filters, calendar &amp; full history live in the dashboard.</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function renderCard(e: NewsletterEvent): string {
  const color = CAT_COLOR[e.category] ?? CAT_COLOR.other;
  const where = e.isOnline ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "TBD";
  return `<tr><td style="padding:8px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;">
      <tr><td style="padding:14px 16px;">
        <span style="display:inline-block;background:${color}1a;color:${color};font:600 11px/1 -apple-system,sans-serif;padding:4px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em;">${esc(e.category)} · ${e.icpScore}</span>
        <a href="${esc(e.url)}" style="display:block;font:600 16px/1.3 -apple-system,Segoe UI,sans-serif;color:#0f172a;text-decoration:none;margin:8px 0 4px;">${esc(e.title)}</a>
        <div style="font:400 13px/1.4 -apple-system,sans-serif;color:#475569;">${fmtDate(e.startAt)} · ${esc(where)}</div>
        ${e.reason ? `<div style="font:400 12px/1.4 -apple-system,sans-serif;color:#94a3b8;margin-top:4px;">${esc(e.reason)}</div>` : ""}
      </td></tr>
    </table>
  </td></tr>`;
}

function emptyState(): string {
  return `<tr><td style="padding:32px 0;text-align:center;font:400 14px/1.4 -apple-system,sans-serif;color:#94a3b8;">No ICP-matched events in the current window. Check the dashboard for the full list.</td></tr>`;
}
