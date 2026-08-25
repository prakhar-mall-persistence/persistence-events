import "dotenv/config";
import { db, schema } from "@pe/shared";
import { eq } from "drizzle-orm";
import { getNewsletterEvents } from "./query.js";
import { renderNewsletter } from "./render.js";
import { sendBroadcast, ensureTag, tagSubscriberByEmail } from "./kit.js";

const TEST_TAG_NAME = "Events Checker (test)";

/**
 * Daily newsletter job. Runs from GitHub Actions at 10:15 IST.
 * Pass --dry-run to render + log without sending (used to validate timing/content).
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const settings = await loadSettings();

  const events = await getNewsletterEvents({
    minScore: Number(settings.newsletter_min_icp_score ?? 60),
    horizonDays: Number(settings.newsletter_horizon_days ?? 14),
    max: Number(settings.newsletter_max_events ?? 25),
  });

  const dashboardUrl = process.env.DASHBOARD_URL ?? "https://persistence-events.vercel.app";
  const html = renderNewsletter(events, dashboardUrl);
  const runDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const testEmail = process.env.KIT_TEST_EMAIL?.trim();
  const subject =
    (testEmail ? "[TEST] " : "") +
    `Persistence Events Daily — ${events.length} picks for ${runDate}`;
  const previewText = events[0]
    ? `${events[0].title} + ${Math.max(0, events.length - 1)} more`
    : "Your daily ICP-matched events";

  if (dryRun) {
    console.log(`[dry-run] ${events.length} events, subject: ${subject}`);
    console.log(html.slice(0, 400) + "…");
    await recordRun(runDate, "dry-run", events.length, null, null);
    return;
  }

  try {
    // Test mode: send ONLY to KIT_TEST_EMAIL via an isolated test tag, never the real list.
    let tagId: number;
    if (testEmail) {
      tagId = await ensureTag(TEST_TAG_NAME);
      await tagSubscriberByEmail(tagId, testEmail);
      console.log(`TEST mode — sending only to ${testEmail} (tag "${TEST_TAG_NAME}" #${tagId}).`);
    } else {
      tagId = Number(process.env.KIT_SUBSCRIBER_TAG_ID);
      if (!tagId) throw new Error("KIT_SUBSCRIBER_TAG_ID is not set and KIT_TEST_EMAIL is empty.");
    }
    const broadcastId = await sendBroadcast({ subject, html, previewText, tagId });
    console.log(`Sent Kit broadcast ${broadcastId} with ${events.length} events.`);
    await recordRun(runDate, testEmail ? "test-sent" : "sent", events.length, broadcastId, null);
  } catch (err) {
    const msg = (err as Error).message;
    console.error("Newsletter send failed:", msg);
    await recordRun(runDate, "error", events.length, null, msg);
    process.exit(1);
  }
}

async function loadSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

async function recordRun(
  runDate: string,
  status: string,
  count: number,
  broadcastId: string | null,
  error: string | null
) {
  await db.insert(schema.newsletterRuns).values({
    runDate,
    status,
    eventCount: count,
    kitBroadcastId: broadcastId,
    error,
  });
}

main().then(() => process.exit(0));
