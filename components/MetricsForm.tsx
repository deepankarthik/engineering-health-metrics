"use client";

import { useState, FormEvent } from "react";

type Props = {
  onSubmitted: () => void;
};

const initial = {
  iteration: "",
  committedStoryPoints: "",
  deliveredStoryPoints: "",
  capacity: "",
  spillOverTotalStoryPoints: "",
  spillOverTotalStories: "",
  spillOverDependencyStoryPoints: "",
  spillOverDependencyStories: "",
};

export function MetricsForm({ onSubmitted }: Props) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iteration: form.iteration.trim(),
          committedStoryPoints: form.committedStoryPoints,
          deliveredStoryPoints: form.deliveredStoryPoints,
          capacity: form.capacity,
          spillOverTotalStoryPoints: form.spillOverTotalStoryPoints,
          spillOverTotalStories: form.spillOverTotalStories,
          spillOverDependencyStoryPoints: form.spillOverDependencyStoryPoints,
          spillOverDependencyStories: form.spillOverDependencyStories,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error ?? "Submit failed.");
        return;
      }
      const k = data.computed as
        | {
            velocity?: number;
            utilizationPct?: number;
            spillOverRatePct?: number;
            bottleneckIndicatorPct?: number;
            target?: number;
          }
        | undefined;
      const summary = k
        ? `Saved. KPIs: velocity ${k.velocity}, utilization ${k.utilizationPct}%, spill ${k.spillOverRatePct}%, bottleneck ${k.bottleneckIndicatorPct}% (target ${k.target} SP).`
        : "Saved.";
      setStatus(summary);
      setForm(initial);
      onSubmitted();
    } catch {
      setStatus("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-corp-navy">Iteration metrics</h2>
      <p className="text-sm text-slate-600">
        KPIs (velocity, utilization %, spill rate %, bottleneck %, target) are computed on the server from these inputs.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Iteration</span>
          <input
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-corp-blue focus:border-corp-blue focus:ring-2"
            value={form.iteration}
            onChange={(e) => update("iteration", e.target.value)}
            placeholder='e.g. 2026 PI 1 - Iteration 2'
          />
        </label>
        <Field
          label="Committed story points"
          value={form.committedStoryPoints}
          onChange={(v) => update("committedStoryPoints", v)}
          type="number"
          min={0}
        />
        <Field
          label="Delivered story points"
          value={form.deliveredStoryPoints}
          onChange={(v) => update("deliveredStoryPoints", v)}
          type="number"
          min={0}
        />
        <Field label="Capacity" value={form.capacity} onChange={(v) => update("capacity", v)} type="number" min={0} />
        <Field
          label="Spill over — total story points"
          value={form.spillOverTotalStoryPoints}
          onChange={(v) => update("spillOverTotalStoryPoints", v)}
          type="number"
          min={0}
        />
        <Field
          label="Spill over — total # of stories"
          value={form.spillOverTotalStories}
          onChange={(v) => update("spillOverTotalStories", v)}
          type="number"
          min={0}
        />
        <Field
          label="Spill over (dependency) — story points"
          value={form.spillOverDependencyStoryPoints}
          onChange={(v) => update("spillOverDependencyStoryPoints", v)}
          type="number"
          min={0}
        />
        <Field
          label="Spill over (dependency) — # of stories"
          value={form.spillOverDependencyStories}
          onChange={(v) => update("spillOverDependencyStories", v)}
          type="number"
          min={0}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-corp-blue px-4 py-2 text-sm font-medium text-white shadow hover:bg-corp-navy disabled:opacity-60"
        >
          {loading ? "Saving…" : "Submit metrics"}
        </button>
        {status && <span className="text-sm text-slate-600">{status}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        required
        type={type}
        min={min}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-corp-blue focus:border-corp-blue focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
