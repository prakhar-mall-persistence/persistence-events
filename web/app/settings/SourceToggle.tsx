"use client";
import { toggleSource, toggleGeography, deleteGeography, updateSetting } from "./actions";
import { useTransition } from "react";

export function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: (v: boolean) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => onToggle(!checked))}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function SourceRow({ k, label, enabled, status, count, lastRun }: any) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-slate-400">
          {status ? `${status} · ${count ?? 0} events` : "not run yet"}
          {lastRun ? ` · ${new Date(lastRun).toLocaleString("en-IN")}` : ""}
        </div>
      </div>
      <Toggle checked={enabled} onToggle={(v) => toggleSource(k, v)} />
    </div>
  );
}

export function GeoRow({ geo }: any) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div>
        <div className="font-medium text-sm">
          {geo.city}, {geo.country}
        </div>
        <div className="text-xs text-slate-400">
          {geo.radiusKm}km{geo.lumaSlug ? ` · lu.ma/${geo.lumaSlug}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Toggle checked={geo.enabled} onToggle={(v) => toggleGeography(geo.id, v)} />
        <button
          disabled={pending}
          onClick={() => start(() => deleteGeography(geo.id))}
          className="text-xs text-red-500 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function SettingInput({
  label,
  settingKey,
  defaultValue,
  suffix,
}: {
  label: string;
  settingKey: string;
  defaultValue: string;
  suffix?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="flex items-center gap-2">
        <input
          defaultValue={defaultValue}
          disabled={pending}
          onBlur={(e) => start(() => updateSetting(settingKey, e.target.value))}
          className="w-24 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right"
        />
        {suffix && <span className="text-xs text-slate-400 w-10">{suffix}</span>}
      </span>
    </label>
  );
}
