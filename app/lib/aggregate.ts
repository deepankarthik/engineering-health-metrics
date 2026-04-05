import type { AggregatedSeries, IterationApiRow } from "./types";

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** Velocity trend X labels like 2026.1.2 from iteration keys (e.g. Jan-26). */
export function velocityPeriodLabel(iteration: string, index: number): string {
  const m = iteration.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (m) {
    const mo = MONTH_MAP[m[1].toLowerCase()];
    if (mo != null) {
      const yy = parseInt(m[2], 10);
      const year = yy >= 70 ? 1900 + yy : 2000 + yy;
      return `${year}.1.${mo}`;
    }
  }
  return `2026.1.${index + 2}`;
}

/**
 * Illustrative Value vs Enablement stacks — form does not capture these;
 * we derive a stable placeholder split from delivered work for the stacked bar.
 */
function placeholderValueEnablement(delivered: number): { value: number; enablement: number } {
  const d = Math.max(0, Math.round(delivered));
  if (d === 0) return { value: 0, enablement: 0 };
  const value = Math.round(d * 0.72);
  const enablement = Math.max(0, d - value);
  return { value, enablement };
}

/**
 * If every iteration has zero delivered, show a minimal mock so the stacked chart is not empty.
 */
function ensureNonEmptyMix(
  labels: string[],
  valueMix: number[],
  enablementMix: number[]
): { valueMix: number[]; enablementMix: number[] } {
  const sum = [...valueMix, ...enablementMix].reduce((a, b) => a + b, 0);
  if (sum > 0 || labels.length === 0) return { valueMix, enablementMix };
  return {
    valueMix: labels.map(() => 40),
    enablementMix: labels.map(() => 15),
  };
}

/**
 * Build parallel arrays for Chart.js from enriched rows (sorted by iteration label).
 */
export function aggregateMetrics(entries: IterationApiRow[]): AggregatedSeries {
  if (!entries.length) {
    return {
      labels: [],
      velocityLabels: [],
      delivered: [],
      target: [],
      capacity: [],
      utilization: [],
      spill: [],
      bottleneck: [],
      velocity: [],
      valueMix: [],
      enablementMix: [],
    };
  }

  const sorted = [...entries].sort((a, b) => a.iteration.localeCompare(b.iteration));

  const labels: string[] = [];
  const velocityLabels: string[] = [];
  const delivered: number[] = [];
  const target: number[] = [];
  const capacity: number[] = [];
  const utilization: number[] = [];
  const spill: number[] = [];
  const bottleneck: number[] = [];
  const velocity: number[] = [];
  let valueMix: number[] = [];
  let enablementMix: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    labels.push(row.iteration);
    velocityLabels.push(velocityPeriodLabel(row.iteration, i));
    delivered.push(row.deliveredStoryPoints);
    target.push(row.target);
    capacity.push(row.capacity);
    utilization.push(row.utilizationPct);
    spill.push(row.spillOverRatePct);
    bottleneck.push(row.bottleneckIndicatorPct);
    velocity.push(row.velocity);
    const mix = placeholderValueEnablement(row.deliveredStoryPoints);
    valueMix.push(mix.value);
    enablementMix.push(mix.enablement);
  }

  const mixAdj = ensureNonEmptyMix(labels, valueMix, enablementMix);
  valueMix = mixAdj.valueMix;
  enablementMix = mixAdj.enablementMix;

  return {
    labels,
    velocityLabels,
    delivered,
    target,
    capacity,
    utilization,
    spill,
    bottleneck,
    velocity,
    valueMix,
    enablementMix,
  };
}
