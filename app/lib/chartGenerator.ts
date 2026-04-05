import type { ChartConfiguration, ChartOptions } from "chart.js";
import { Chart } from "chart.js/auto";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { CORP_COLORS } from "./colors";
import type { AggregatedSeries } from "./types";

export { CORP_COLORS };

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 420;

let pluginsRegistered = false;

function registerChartPlugins(ChartNS: typeof Chart) {
  if (pluginsRegistered) return;
  ChartNS.register(ChartDataLabels);
  pluginsRegistered = true;
}

function createRenderer(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  return new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: "#ffffff",
    chartCallback: registerChartPlugins,
  });
}

const fontFamily = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const titleFontSize = 12;
const tickFontSize = 11;
const labelFontSize = 11;

const hiddenYAxis = {
  beginAtZero: true,
  ticks: { display: false },
  border: { display: false },
  grid: { display: false },
};

const xAxisReport = {
  ticks: {
    color: CORP_COLORS.slate,
    font: { family: fontFamily, size: tickFontSize },
    maxRotation: 0,
  },
  grid: {
    color: CORP_COLORS.grid,
    lineWidth: 1,
    drawTicks: false,
  },
  border: { display: false },
};

/** Shared layout; cast at call site to the active chart type (avoids plugin option variance). */
function baseChartOptions(title: string): ChartOptions {
  const upper = title.toUpperCase();
  return {
    responsive: false,
    layout: { padding: { top: 18, right: 10, bottom: 6, left: 10 } },
    plugins: {
      title: {
        display: true,
        text: upper,
        align: "center",
        color: CORP_COLORS.navy,
        font: { family: fontFamily, size: titleFontSize, weight: "bold" },
        padding: { top: 4, bottom: 14 },
      },
      legend: {
        display: true,
        position: "top",
        align: "center",
        labels: {
          color: CORP_COLORS.slate,
          font: { family: fontFamily, size: tickFontSize },
          usePointStyle: true,
          padding: 14,
          boxWidth: 8,
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: xAxisReport,
      y: hiddenYAxis,
    },
  };
}

function lineYMax(values: number[]): number {
  const m = Math.max(0, ...values);
  if (m === 0) return 1;
  return m * 1.18;
}

/**
 * Line chart — Delivered vs Target, Spill %, Bottleneck %, Velocity.
 */
export async function generateLineChart(
  labels: string[],
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
  }[],
  title: string,
  datalabelFormatter: (v: number) => string
): Promise<Buffer> {
  const renderer = createRenderer();
  const base = baseChartOptions(title) as ChartOptions<"line">;
  const flat = datasets.flatMap((d) => d.data);
  const yMax = lineYMax(flat);

  const cfg: ChartConfiguration<"line"> = {
    type: "line",
    data: {
      labels: labels.length ? labels : ["No data"],
      datasets: datasets.length
        ? datasets.map((d) => ({
            label: d.label,
            data: d.data,
            borderColor: d.borderColor ?? CORP_COLORS.orange,
            backgroundColor: d.backgroundColor ?? "transparent",
            fill: d.fill ?? false,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: d.pointBackgroundColor ?? "#ffffff",
            pointBorderColor: d.pointBorderColor ?? d.borderColor ?? CORP_COLORS.orange,
            pointBorderWidth: 2,
          }))
        : [
            {
              label: "—",
              data: [0],
              borderColor: CORP_COLORS.slate,
              backgroundColor: "transparent",
              fill: false,
            },
          ],
    },
    options: {
      ...base,
      plugins: {
        ...base.plugins,
        datalabels: {
          display: true,
          align: "end",
          anchor: "end",
          offset: 4,
          clip: false,
          color: CORP_COLORS.slate,
          font: { family: fontFamily, size: labelFontSize, weight: 600 },
          formatter: (v) => (typeof v === "number" ? datalabelFormatter(v) : ""),
        },
      },
      scales: {
        x: xAxisReport,
        y: { ...hiddenYAxis, max: yMax },
      },
    },
  };
  return renderer.renderToBuffer(cfg as ChartConfiguration);
}

type BarPoint = number | [number, number] | null;

/**
 * Capacity (orange) with narrower utilization bar (pink) on the same scale (story points).
 */
export async function generateCapacityUtilizationChart(
  labels: string[],
  capacity: number[],
  utilizationPct: number[],
  title: string
): Promise<Buffer> {
  const renderer = createRenderer();
  const base = baseChartOptions(title) as ChartOptions<"bar">;
  const cap = capacity.length ? capacity : [0];
  const util = utilizationPct.length ? utilizationPct : [0];
  const yMax = Math.max(1, ...cap) * 1.12;

  const capData: BarPoint[] = cap.map((c) => (c > 0 ? ([0, c] as [number, number]) : ([0, 0] as [number, number])));
  const utilData: BarPoint[] = cap.map((c, i) => {
    const u = util[i] ?? 0;
    const h = c > 0 ? (c * u) / 100 : 0;
    return [0, h] as [number, number];
  });

  const cfg: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["No data"],
      datasets: [
        {
          label: "Capacity",
          data: capData as number[],
          backgroundColor: CORP_COLORS.amber,
          borderWidth: 0,
          maxBarThickness: 52,
          order: 2,
          borderRadius: 4,
          borderSkipped: false,
          grouped: false,
          categoryPercentage: 0.62,
          barPercentage: 1,
        },
        {
          label: "Utilization",
          data: utilData as number[],
          backgroundColor: CORP_COLORS.red,
          borderWidth: 0,
          maxBarThickness: 28,
          order: 1,
          borderRadius: 4,
          borderSkipped: false,
          grouped: false,
          categoryPercentage: 0.62,
          barPercentage: 1,
          datalabels: {
            display: true,
            color: "#ffffff",
            font: { family: fontFamily, size: labelFontSize, weight: "bold" },
            anchor: "center",
            align: "center",
            formatter: (_v, ctx) => {
              const i = ctx.dataIndex;
              const u = util[i];
              return u != null ? String(Math.round(u)) : "";
            },
          },
        },
      ],
    },
    options: {
      ...base,
      plugins: {
        ...base.plugins,
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: xAxisReport,
        y: { ...hiddenYAxis, max: yMax },
      },
    },
  };
  return renderer.renderToBuffer(cfg as ChartConfiguration);
}

/**
 * Grouped or stacked bar chart.
 */
export async function generateBarChart(
  labels: string[],
  datasets: { label: string; data: number[]; backgroundColor?: string; datalabelsColor?: string }[],
  title: string,
  stacked = false
): Promise<Buffer> {
  const renderer = createRenderer();
  const base = baseChartOptions(title) as ChartOptions<"bar">;
  const flat = datasets.flatMap((d) => d.data);
  const yMax = Math.max(1, ...flat) * 1.12;

  const cfg: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["No data"],
      datasets: datasets.length
        ? datasets.map((d) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.backgroundColor ?? CORP_COLORS.orange,
            borderRadius: 4,
            maxBarThickness: 48,
            borderSkipped: false,
            datalabels: {
              display: true,
              color: d.datalabelsColor ?? "#ffffff",
              font: { family: fontFamily, size: labelFontSize - 1, weight: "bold" },
              anchor: "center",
              align: "center",
              formatter: (v: number) => (v > 0 ? String(Math.round(v)) : ""),
            },
          }))
        : [
            {
              label: "—",
              data: [0],
              backgroundColor: CORP_COLORS.slate,
              borderRadius: 4,
              datalabels: { display: false },
            },
          ],
    },
    options: {
      ...base,
      plugins: {
        ...base.plugins,
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: { ...xAxisReport, stacked },
        y: { ...hiddenYAxis, stacked, max: yMax },
      },
    },
  };
  return renderer.renderToBuffer(cfg as ChartConfiguration);
}

export async function generateStackedChart(
  labels: string[],
  valueSeries: number[],
  enablementSeries: number[],
  title: string
): Promise<Buffer> {
  return generateBarChart(
    labels,
    [
      {
        label: "Customer Value",
        data: valueSeries,
        backgroundColor: CORP_COLORS.amber,
        datalabelsColor: "#ffffff",
      },
      {
        label: "Platform / Quality",
        data: enablementSeries,
        backgroundColor: CORP_COLORS.blue,
        datalabelsColor: "#ffffff",
      },
    ],
    title,
    true
  );
}

/**
 * Produce all six dashboard charts as PNG buffers for PPT/PDF pipelines.
 */
export async function generateAllDashboardCharts(series: AggregatedSeries): Promise<{
  deliveryPredictability: Buffer;
  capacityUtilization: Buffer;
  valueEnablement: Buffer;
  spillOver: Buffer;
  bottleneck: Buffer;
  velocity: Buffer;
}> {
  const labels = series.labels;
  const vLabels = series.velocityLabels.length ? series.velocityLabels : labels;

  const deliveryPredictability = await generateLineChart(
    labels,
    [
      {
        label: "Delivered",
        data: series.delivered,
        borderColor: CORP_COLORS.blue,
        pointBorderColor: CORP_COLORS.blue,
      },
      {
        label: "Target",
        data: series.target,
        borderColor: CORP_COLORS.orange,
        pointBorderColor: CORP_COLORS.orange,
      },
    ],
    "Delivery Predictability",
    (v) => String(Math.round(v))
  );

  const capacityUtilization = await generateCapacityUtilizationChart(
    labels,
    series.capacity,
    series.utilization,
    "Capacity Utilization %"
  );

  const valueEnablement = await generateStackedChart(
    labels,
    series.valueMix,
    series.enablementMix,
    "Value vs Enablement Mix"
  );

  const spillOver = await generateLineChart(
    labels,
    [
      {
        label: "Spill over rate %",
        data: series.spill,
        borderColor: CORP_COLORS.orange,
        fill: false,
        pointBorderColor: CORP_COLORS.orange,
      },
    ],
    "Spill Over Rate",
    (v) => `${v.toFixed(1)}%`
  );

  const bottleneck = await generateLineChart(
    labels,
    [
      {
        label: "Spillover rate due to external causes",
        data: series.bottleneck,
        borderColor: CORP_COLORS.orange,
        fill: false,
        pointBorderColor: CORP_COLORS.orange,
      },
    ],
    "Bottleneck Indicator",
    (v) => `${v.toFixed(1)}%`
  );

  const velocity = await generateLineChart(
    vLabels,
    [
      {
        label: "Velocity",
        data: series.velocity,
        borderColor: CORP_COLORS.orange,
        fill: false,
        pointBorderColor: CORP_COLORS.orange,
      },
    ],
    "Velocity Trend",
    (v) => String(Math.round(v))
  );

  return {
    deliveryPredictability,
    capacityUtilization,
    valueEnablement,
    spillOver,
    bottleneck,
    velocity,
  };
}
