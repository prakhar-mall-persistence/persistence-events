import { NextResponse } from "next/server";
import { db, schema } from "@pe/shared";
import { getEvents } from "@/lib/queries";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Renders the same content the daily newsletter would send *right now*, for review.
 * Uses the current settings (min score / horizon / max). Read-only — never sends.
 */
export async function GET() {
  const rows = await db.select().from(schema.settings);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  const minScore = Number(s.newsletter_min_icp_score ?? 60);
  const horizon = Number(s.newsletter_horizon_days ?? 14);
  const max = Number(s.newsletter_max_events ?? 25);

  const now = new Date();
  const to = new Date(now.getTime() + horizon * 86400_000);
  const events = await getEvents(
    { minScore, from: now.toISOString(), to: to.toISOString(), sort: "score" },
    max
  );

  const dashboardUrl = process.env.DASHBOARD_URL ?? "";
  const cards = events
    .map(
      (e) => `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin:8px 0;">
      <span style="background:#7c3aed1a;color:#7c3aed;font:600 11px sans-serif;padding:4px 8px;border-radius:6px;">${(e.category ?? "other").toUpperCase()} · ${e.icpScore ?? "—"}</span>
      <a href="${e.url}" style="display:block;font:600 16px sans-serif;color:#0f172a;text-decoration:none;margin:8px 0 4px;">${escapeHtml(e.title)}</a>
      <div style="font:400 13px sans-serif;color:#475569;">${fmtDateTime(e.startAt)} · ${e.isOnline ? "Online" : escapeHtml([e.venue, e.city].filter(Boolean).join(", ") || "TBD")}</div>
      ${e.reason ? `<div style="font:400 12px sans-serif;color:#94a3b8;margin-top:4px;">${escapeHtml(e.reason)}</div>` : ""}
    </div>`
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:28px 32px;">
      <div style="font:700 22px sans-serif;color:#0f172a;">Persistence Events Daily <span style="font:400 12px sans-serif;color:#f59e0b;">(PREVIEW)</span></div>
      <div style="font:400 14px sans-serif;color:#64748b;margin:4px 0 16px;">${events.length} events matched · min ICP ${minScore} · next ${horizon} days</div>
      ${cards || '<div style="color:#94a3b8;padding:24px 0;text-align:center;">No ICP-matched events in window.</div>'}
      <div style="text-align:center;margin-top:24px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font:600 15px sans-serif;padding:14px 28px;border-radius:10px;">Open the full dashboard →</a>
      </div>
    </div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
