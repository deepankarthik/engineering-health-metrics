import { NextResponse } from "next/server";
import { computeMetrics, normalizeStored } from "@/app/lib/computeMetrics";
import { appendMetric } from "@/app/lib/storage";
import type { IterationStored } from "@/app/lib/types";

export const runtime = "nodejs";

function parseIntField(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n);
}

/**
 * Parse POST body into a stored iteration row. All numeric fields must be finite integers ≥ 0.
 */
function parseBody(body: unknown): IterationStored | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const iteration = typeof o.iteration === "string" ? o.iteration.trim() : "";
  if (!iteration) return null;

  const committedStoryPoints = parseIntField(o.committedStoryPoints);
  const deliveredStoryPoints = parseIntField(o.deliveredStoryPoints);
  const capacity = parseIntField(o.capacity);
  const spillOverTotalStoryPoints = parseIntField(o.spillOverTotalStoryPoints);
  const spillOverTotalStories = parseIntField(o.spillOverTotalStories);
  const spillOverDependencyStoryPoints = parseIntField(o.spillOverDependencyStoryPoints);
  const spillOverDependencyStories = parseIntField(o.spillOverDependencyStories);

  const fields = [
    committedStoryPoints,
    deliveredStoryPoints,
    capacity,
    spillOverTotalStoryPoints,
    spillOverTotalStories,
    spillOverDependencyStoryPoints,
    spillOverDependencyStories,
  ];
  if (fields.some((n) => !Number.isFinite(n) || n < 0)) {
    return null;
  }

  const raw: IterationStored = {
    iteration,
    committedStoryPoints,
    deliveredStoryPoints,
    capacity,
    spillOverTotalStoryPoints,
    spillOverTotalStories,
    spillOverDependencyStoryPoints,
    spillOverDependencyStories,
  };

  return normalizeStored(raw);
}

/**
 * POST /api/submit — persist raw iteration inputs; KPIs are computed on read/export.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const entry = parseBody(json);
    if (!entry) {
      return NextResponse.json(
        { error: "Invalid payload: check iteration and non-negative integer fields." },
        { status: 400 }
      );
    }
    const all = await appendMetric(entry);
    const computed = computeMetrics(entry);
    return NextResponse.json({ ok: true, count: all.length, computed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save metrics." }, { status: 500 });
  }
}
