/**
 * Raw iteration row persisted in data/metrics.json (manager inputs only).
 */
export type IterationStored = {
  iteration: string;
  committedStoryPoints: number;
  deliveredStoryPoints: number;
  capacity: number;
  spillOverTotalStoryPoints: number;
  spillOverTotalStories: number;
  spillOverDependencyStoryPoints: number;
  spillOverDependencyStories: number;
};

/** Predefined delivery target for predictability charts (story points). */
export const TARGET_STORY_POINTS = 90;

/**
 * KPIs computed server-side from stored inputs (safe division, rounded %).
 */
export type ComputedKpis = {
  velocity: number;
  utilizationPct: number;
  spillOverRatePct: number;
  bottleneckIndicatorPct: number;
  target: number;
};

/** GET /api/data row: stored fields plus computed KPIs (flattened). */
export type IterationApiRow = IterationStored & ComputedKpis;

/** Parallel arrays for Chart.js (server + preview). */
export type AggregatedSeries = {
  labels: string[];
  /** X-axis labels for velocity chart (e.g. 2026.1.2). */
  velocityLabels: string[];
  delivered: number[];
  target: number[];
  capacity: number[];
  /** Utilization percentage (1 decimal). */
  utilization: number[];
  spill: number[];
  bottleneck: number[];
  velocity: number[];
  /** Illustrative value/enablement split (placeholder — not collected in form). */
  valueMix: number[];
  enablementMix: number[];
};
