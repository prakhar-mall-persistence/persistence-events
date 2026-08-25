import type { Browser, BrowserContext } from "playwright";

/**
 * Playwright is imported lazily (inside getContext) rather than at module load. Two reasons:
 *  - the HTTP-only adapters (Confs.tech, Eventbrite) and the DB/scorer never need Chromium,
 *    so we don't pay to load it unless a browser adapter actually runs;
 *  - eagerly importing playwright can perturb the process's global fetch/undici in some
 *    environments, which would break the Neon HTTP driver used everywhere else.
 */
let browser: Browser | null = null;

export async function getContext(): Promise<BrowserContext> {
  if (!browser) {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  }
  return browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
  });
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
