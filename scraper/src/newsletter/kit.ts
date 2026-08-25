import { politeFetch } from "../lib/http.js";

/**
 * Kit (ConvertKit) v4 client — broadcasts, tags, subscribers.
 * Docs: https://developers.kit.com  (base https://api.kit.com/v4)
 * Auth: X-Kit-Api-Key header.
 */
const BASE = "https://api.kit.com/v4";

function headers() {
  const key = process.env.KIT_API_KEY;
  if (!key) throw new Error("KIT_API_KEY is not set.");
  return {
    "X-Kit-Api-Key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function kit(path: string, init?: RequestInit) {
  const res = await politeFetch(`${BASE}${path}`, { ...init, headers: headers() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Kit ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

/** Find an existing tag by name (case-insensitive) or create it; returns its numeric id. */
export async function ensureTag(name: string): Promise<number> {
  const list = await kit("/tags");
  const found = (list.tags ?? []).find(
    (t: any) => (t.name ?? "").toLowerCase() === name.toLowerCase()
  );
  if (found) return Number(found.id);
  const created = await kit("/tags", { method: "POST", body: JSON.stringify({ name }) });
  return Number(created.tag?.id ?? created.id);
}

/** Create (or no-op if existing) a subscriber by email. */
export async function ensureSubscriber(email: string): Promise<void> {
  await kit("/subscribers", {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
}

/** Tag a subscriber by email. The subscriber must exist first (v4 returns 404 otherwise). */
export async function tagSubscriberByEmail(tagId: number, email: string): Promise<void> {
  await ensureSubscriber(email);
  await kit(`/tags/${tagId}/subscribers`, {
    method: "POST",
    body: JSON.stringify({ email_address: email }),
  });
}

export interface SendBroadcastInput {
  subject: string;
  html: string;
  previewText: string;
  /** Numeric tag id to target. */
  tagId: number;
  /** ISO time to send; a now/near-now time triggers an immediate send. */
  sendAt?: string;
}

/** Create + schedule a broadcast to a tag. Returns the broadcast id. */
export async function sendBroadcast(input: SendBroadcastInput): Promise<string> {
  const nowIso = input.sendAt ?? new Date().toISOString();
  const body = {
    subject: input.subject,
    content: input.html,
    description: `Persistence Events Daily — ${input.subject}`,
    preview_text: input.previewText,
    public: false,
    published_at: nowIso,
    send_at: nowIso,
    subscriber_filter: [
      { all: [{ type: "tag", ids: [input.tagId] }], any: null, none: null },
    ],
  };
  const json = await kit("/broadcasts", { method: "POST", body: JSON.stringify(body) });
  return String(json?.broadcast?.id ?? json?.id ?? "unknown");
}
