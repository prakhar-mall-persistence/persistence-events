import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema.js";

/**
 * The neon-http driver issues a single fetch per query with no retry, so a transient
 * network blip (ETIMEDOUT / fetch failed) crashes the whole query. We install a retrying
 * fetch with exponential backoff for those transient cases. Safe because Neon's HTTP
 * query endpoint is idempotent for our usage (each call is one autocommit statement).
 */
neonConfig.fetchFunction = async (input: any, init: any) => {
  const retries = 4;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * 2 ** attempt + Math.random() * 300));
      }
    }
  }
  throw lastErr;
};

/**
 * Lazily-initialized Drizzle client. We DON'T throw at import time (that would break
 * `next build`, which loads route modules without a DATABASE_URL). The connection is
 * created on first query instead.
 */
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  _db = drizzle(neon(connectionString), { schema });
  return _db;
}

/** Proxy that defers connection creation until a method is actually called. */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
