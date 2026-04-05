"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { MetricsForm } from "@/components/MetricsForm";
import type { IterationApiRow } from "@/app/lib/types";

export default function Home() {
  const [allRows, setAllRows] = useState<IterationApiRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/data");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as IterationApiRow[];
      setAllRows(Array.isArray(data) ? data : []);
    } catch {
      setLoadError("Could not load metrics.");
      setAllRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Client-side filter; exports always use the full stored file on the server. */
  const previewRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => r.iteration.toLowerCase().includes(q));
  }, [allRows, filter]);

  async function clearAll() {
    if (!confirm("Clear all stored iterations? This cannot be undone.")) return;
    setBusy("clear");
    try {
      const res = await fetch("/api/clear", { method: "POST" });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  async function downloadReport(path: string, label: string, filename: string) {
    setBusy(label);
    try {
      const res = await fetch(path);
      const ct = res.headers.get("Content-Type") ?? "";
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(err?.error ?? "Report generation failed.");
        return;
      }
      if (ct.includes("application/json")) {
        alert("Unexpected response from server.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download report.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-corp-teal">Your Organization Name Here</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-corp-navy">Engineering Health Dashboard</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Submit iteration-level inputs; KPIs are computed on the server, previewed here, and exported as PowerPoint or
          PDF in a 2×3 corporate layout.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-1 lg:items-start">
        <div className="space-y-6">
          <MetricsForm onSubmitted={load} />
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
            <h3 className="text-sm font-semibold text-corp-navy">Filter preview</h3>
            <p className="mt-1 text-xs text-slate-600">
              Optional substring match on iteration. Downloads include every stored iteration.
            </p>
            <input
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="e.g. PI 1 or Iteration 2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </section>
        

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void downloadReport("/api/generate/ppt", "ppt", "report.pptx")}
              disabled={!!busy || !allRows.length}
              className="rounded-lg bg-corp-navy px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "ppt" ? "Preparing…" : "Download PowerPoint"}
            </button>
            <button
              type="button"
              onClick={() => void downloadReport("/api/generate/pdf", "pdf", "report.pdf")}
              disabled={!!busy || !allRows.length}
              className="rounded-lg border border-corp-navy bg-white px-4 py-2 text-sm font-medium text-corp-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "pdf" ? "Rendering…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => void clearAll()}
              disabled={!!busy}
              className="ml-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Clear all data
            </button>
          </div>
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-corp-navy">Dashboard preview</h2>
            <Dashboard entries={previewRows} />
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
