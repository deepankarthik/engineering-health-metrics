import type { ComputedKpis, IterationApiRow, IterationStored } from "./types";
import { TARGET_STORY_POINTS } from "./types";

/** Clamp to a finite, non-negative number (avoids NaN / Infinity in charts). */
export function safeNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Round percentage KPIs to one decimal place per requirements. */
export function roundPct1(n: number): number {
  const x = safeNonNegative(n);
  return Math.round(x * 10) / 10;
}

/**
 * Safe ratio: returns 0 when denominator is 0 (no NaN / Infinity).
 */
export function safeRatio(numerator: number, denominator: number): number {
  const d = safeNonNegative(denominator);
  if (d === 0) return 0;
  const num = safeNonNegative(numerator);
  return num / d;
}

/**
 * Normalize JSON / API input into clean integers for storage math.
 */
export function normalizeStored(input: IterationStored): IterationStored {
  const int = (v: number) => Math.round(safeNonNegative(v));
  return {
    iteration: String(input.iteration ?? "").trim(),
    committedStoryPoints: int(input.committedStoryPoints),
    deliveredStoryPoints: int(input.deliveredStoryPoints),
    capacity: int(input.capacity),
    spillOverTotalStoryPoints: int(input.spillOverTotalStoryPoints),
    spillOverTotalStories: int(input.spillOverTotalStories),
    spillOverDependencyStoryPoints: int(input.spillOverDependencyStoryPoints),
    spillOverDependencyStories: int(input.spillOverDependencyStories),
  };
}

/**
 * Derived engineering KPIs (backend source of truth for reporting).
 *
 * - Velocity = delivered story points
 * - Utilization % = (delivered / capacity) * 100
 * - Spill over rate % = (spill total SP / committed SP) * 100
 * - Bottleneck % = (dependency spill SP / spill total SP) * 100
 * - Target = constant (TARGET_STORY_POINTS)
 */
export function computeMetrics(input: IterationStored): ComputedKpis {
  const row = normalizeStored(input);
  const committed = row.committedStoryPoints;
  const delivered = row.deliveredStoryPoints;
  const capacity = row.capacity;
  const spillTotalSp = row.spillOverTotalStoryPoints;
  const spillDepSp = row.spillOverDependencyStoryPoints;

  const velocity = delivered;
  const utilizationPct = roundPct1(safeRatio(delivered, capacity) * 100);
  const spillOverRatePct = roundPct1(safeRatio(spillTotalSp, committed) * 100);
  const bottleneckIndicatorPct = roundPct1(safeRatio(spillDepSp, spillTotalSp) * 100);

  return {
    velocity,
    utilizationPct,
    spillOverRatePct,
    bottleneckIndicatorPct,
    target: TARGET_STORY_POINTS,
  };
}

/** Attach computed KPIs for API consumers and charts. */
export function enrichIterationRecords(stored: IterationStored[]): IterationApiRow[] {
  return stored.map((raw): IterationApiRow => {
    const base = normalizeStored(raw);
    return { ...base, ...computeMetrics(base) };
  });
}
