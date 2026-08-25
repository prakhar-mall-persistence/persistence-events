import { db, schema } from "@pe/shared";
import { addGeography } from "./actions";
import { SourceRow, GeoRow, SettingInput } from "./SourceToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [geos, sources, settingsRows] = await Promise.all([
    db.select().from(schema.geographies),
    db.select().from(schema.sources),
    db.select().from(schema.settings),
  ]);
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value ?? ""]));

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      <Card title="Geographies" desc="Cities the scraper targets. Add as many as you like.">
        <div>{geos.map((g) => <GeoRow key={g.id} geo={g} />)}</div>
        <form action={addGeography} className="flex flex-wrap gap-2 pt-3">
          <input name="city" placeholder="City" required className={inp} />
          <input name="country" placeholder="Country" required className={inp} />
          <input name="radiusKm" placeholder="Radius km" defaultValue="50" className={inp + " w-24"} />
          <input name="lumaSlug" placeholder="lu.ma slug (optional)" className={inp} />
          <button className="rounded-md bg-brand text-white px-4 py-1.5 text-sm font-medium">Add</button>
        </form>
      </Card>

      <Card title="Sources" desc="Toggle which platforms are scraped.">
        {sources.map((src) => (
          <SourceRow
            key={src.key}
            k={src.key}
            label={src.label}
            enabled={src.enabled}
            status={src.lastStatus}
            count={src.lastCount}
            lastRun={src.lastRunAt}
          />
        ))}
      </Card>

      <Card title="Newsletter" desc="Controls the daily 10:15 IST email. Send time is set in the GitHub Action cron.">
        <SettingInput label="Minimum ICP score to include" settingKey="newsletter_min_icp_score" defaultValue={s.newsletter_min_icp_score ?? "60"} />
        <SettingInput label="Look-ahead window" settingKey="newsletter_horizon_days" defaultValue={s.newsletter_horizon_days ?? "14"} suffix="days" />
        <SettingInput label="Max events in email" settingKey="newsletter_max_events" defaultValue={s.newsletter_max_events ?? "25"} />
        <p className="text-xs text-slate-400 pt-2">
          Subscribers are managed in Kit (ConvertKit). The email sends to the tag configured via
          <code className="mx-1">KIT_SUBSCRIBER_TAG_ID</code>.
        </p>
      </Card>
    </div>
  );
}

const inp =
  "rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm";

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-slate-400 mb-3">{desc}</p>
      {children}
    </section>
  );
}
