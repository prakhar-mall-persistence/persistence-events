"use server";

/**
 * Trigger a scrape by dispatching the GitHub Actions "Scrape events" workflow.
 * Runs server-side so the token never reaches the browser. Requires env:
 *   GITHUB_REPO           e.g. "prakhar-mall-persistence/persistence-events"
 *   GITHUB_DISPATCH_TOKEN a PAT (or fine-grained token) with actions:write
 * Heavy Playwright scraping can't run on Vercel serverless, so we delegate to Actions.
 */
export async function triggerScrape(): Promise<{ ok: boolean; message: string }> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!repo || !token) {
    return {
      ok: false,
      message:
        "Set GITHUB_REPO and GITHUB_DISPATCH_TOKEN in the app env to enable one-click scraping.",
    };
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );
  if (res.status === 204) return { ok: true, message: "Scrape started — data updates in a few minutes." };
  const body = await res.text();
  return { ok: false, message: `GitHub dispatch failed (${res.status}): ${body.slice(0, 140)}` };
}
