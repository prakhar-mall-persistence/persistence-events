/** Small polite-HTTP helper: retries with backoff + a real UA + jitter. */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 PersistenceEventsBot/0.1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function politeFetch(
  url: string,
  init: RequestInit = {},
  { retries = 3, baseDelayMs = 800 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          "User-Agent": UA,
          Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
          ...(init.headers ?? {}),
        },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 400);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

export { sleep };
