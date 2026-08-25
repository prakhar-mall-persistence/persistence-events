import { NextRequest, NextResponse } from "next/server";

/**
 * Token-protected manual trigger. Since heavy Playwright scraping runs in GitHub Actions,
 * this endpoint dispatches the "Scrape events" workflow via the GitHub API rather than
 * scraping inline (which won't run reliably on Vercel serverless).
 *
 * Requires env: GITHUB_DISPATCH_TOKEN (repo scope), GITHUB_REPO ("owner/repo").
 * Auth: header  x-trigger-secret: <CRON_TRIGGER_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-trigger-secret");
  if (!secret || secret !== process.env.CRON_TRIGGER_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!repo || !token) {
    return NextResponse.json(
      { error: "GITHUB_REPO / GITHUB_DISPATCH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main" }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: 502 });
  }
  return NextResponse.json({ ok: true, dispatched: "scrape.yml" });
}
