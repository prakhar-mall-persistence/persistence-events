import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";
import { db, schema, PERSISTENCE_ICP, type IcpResult } from "@pe/shared";
import { eq, inArray } from "drizzle-orm";

const MODEL = "claude-sonnet-5";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function contentHash(e: { title: string; description?: string | null; tags?: string[] | null }) {
  return crypto
    .createHash("sha256")
    .update(`${e.title}\n${e.description ?? ""}\n${(e.tags ?? []).join(",")}`)
    .digest("hex")
    .slice(0, 32);
}

const SYSTEM = `You are an ICP-relevance scorer for Persistence. Score each event 0-100 for how
well its likely attendees match Persistence's Ideal Customer Profile.

${PERSISTENCE_ICP}

Return ONLY compact JSON, no prose: an array where each item is
{"i": <index>, "icpScore": <0-100 int>, "category": "AI|tech|founder|investor|community|other", "reason": "<max 12 words>"}.`;

/**
 * Score events that don't yet have a score for their current content hash.
 * Batches up to `batchSize` events per model call to keep it cheap.
 */
export async function scoreEvents(eventIds: number[], batchSize = 12): Promise<number> {
  if (eventIds.length === 0) return 0;

  const rows = await db
    .select()
    .from(schema.events)
    .where(inArray(schema.events.id, eventIds));

  const existing = await db
    .select()
    .from(schema.eventScores)
    .where(inArray(schema.eventScores.eventId, eventIds));
  const existingByEvent = new Map(existing.map((s) => [s.eventId, s]));

  const toScore = rows.filter((e) => {
    const prev = existingByEvent.get(e.id);
    return !prev || prev.contentHash !== contentHash(e);
  });

  let scored = 0;
  for (let i = 0; i < toScore.length; i += batchSize) {
    const batch = toScore.slice(i, i + batchSize);
    const prompt = batch
      .map(
        (e, idx) =>
          `[${idx}] title: ${e.title}\ndesc: ${(e.description ?? "").slice(0, 300)}\ntags: ${(e.tags ?? []).join(", ")}\ncity: ${e.city ?? ""}`
      )
      .join("\n---\n");

    let results: Array<{ i: number } & IcpResult> = [];
    try {
      const msg = await anthropic.messages.create({
        model: MODEL,
        // ~80 output tokens per event; generous headroom so JSON is never truncated.
        max_tokens: Math.min(4096, 200 + batch.length * 90),
        system: SYSTEM,
        messages: [{ role: "user", content: `Score these ${batch.length} events:\n\n${prompt}` }],
      });
      const text = msg.content.find((c) => c.type === "text")?.text ?? "[]";
      results = parseScores(text);
    } catch (err) {
      console.error("scorer batch failed:", (err as Error).message);
      continue;
    }

    for (const r of results) {
      const e = batch[r.i];
      if (!e) continue;
      await db
        .insert(schema.eventScores)
        .values({
          eventId: e.id,
          icpScore: clamp(r.icpScore),
          category: r.category ?? "other",
          reason: r.reason ?? null,
          contentHash: contentHash(e),
          model: MODEL,
        })
        .onConflictDoUpdate({
          target: schema.eventScores.eventId,
          set: {
            icpScore: clamp(r.icpScore),
            category: r.category ?? "other",
            reason: r.reason ?? null,
            contentHash: contentHash(e),
            model: MODEL,
          },
        });
      scored++;
    }
  }
  return scored;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));

/**
 * Parse the model's JSON array defensively. Handles prose wrappers and truncated output by
 * (1) slicing to the outer brackets, then (2) if that fails, salvaging every complete
 * `{...}` object so a single cut-off tail doesn't lose the whole batch.
 */
function parseScores(text: string): Array<{ i: number } & IcpResult> {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fall through to salvage */
    }
  }
  const objs: Array<{ i: number } & IcpResult> = [];
  for (const m of text.matchAll(/\{[^{}]*\}/g)) {
    try {
      objs.push(JSON.parse(m[0]));
    } catch {
      /* skip malformed object */
    }
  }
  return objs;
}
