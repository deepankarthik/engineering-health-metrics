"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line, Bar } from "react-chartjs-2";
import { aggregateMetrics } from "@/app/lib/aggregate";
import type { IterationApiRow } from "@/app/lib/types";
import { CORP_COLORS } from "@/app/lib/colors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const fontFamily = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const titlePlugin = (text: string) => ({
  display: true,
  text: text.toUpperCase(),
  align: "center" as const,
  color: CORP_COLORS.navy,
  font: { family: fontFamily, size: 14, weight: "bold" as const },
  padding: { top: 4, bottom: 12 } as const,
});

const legendPlugin = {
  position: "top" as const,
  align: "center" as const,
  labels: {
    color: CORP_COLORS.slate,
    usePointStyle: false,
    padding: 12,
    font: { family: fontFamily, size: 12 },
    boxWidth: 2,
  },
};

const xScale = {
  ticks: { color: CORP_COLORS.slate, font: { size: 11 }, maxRotation: 0 },
  grid: { color: CORP_COLORS.grid, lineWidth: 1, drawTicks: false },
  border: { display: false },
};

const yHidden = {
  beginAtZero: true,
  ticks: { display: false },
  border: { display: false },
  grid: { display: false },
};

function lineYMax(values: number[]): number {
  const m = Math.max(0, ...values);
  if (m === 0) return 1;
  return m * 1.18;
}

const cardClass =
  "rounded-sm border border-dashed border-slate-400 bg-[#F1F5F9] p-3 shadow-none";

type Props = {
  entries: IterationApiRow[];
};

export function Dashboard({ entries }: Props) {
  const series = useMemo(() => aggregateMetrics(entries), [entries]);

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        No iterations yet. Submit metrics to preview the dashboard.
      </div>
    );
  }

  const deliveryMax = lineYMax([...series.delivered, ...series.target]);
  const cap = series.capacity.length ? series.capacity : [0];
  const util = series.utilization.length ? series.utilization : [0];
  const capMax = Math.max(1, ...cap) * 1.12;
  const capData = cap.map((c) => (c > 0 ? ([0, c] as [number, number]) : ([0, 0] as [number, number])));
  const utilData = cap.map((c, i) => {
    const u = util[i] ?? 0;
    const h = c > 0 ? (c * u) / 100 : 0;
    return [0, h] as [number, number];
  });
  const mixMax = Math.max(1, ...series.valueMix, ...series.enablementMix) * 1.12;
  const vLabels = series.velocityLabels.length ? series.velocityLabels : series.labels;
  const velMax = lineYMax(series.velocity);

  return (
    <div className="rounded-xl bg-slate-100/80 p-4 lg:p-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <div className={cardClass}>
          <Line
            data={{
              labels: series.labels,
              datasets: [
                {
                  label: "Delivered",
                  data: series.delivered,
                  borderColor: CORP_COLORS.blue,
                  backgroundColor: "transparent",
                  tension: 0.2,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: CORP_COLORS.blue,
                  pointBorderWidth: 2,
                },
                {
                  label: "Target",
                  data: series.target,
                  borderColor: CORP_COLORS.orange,
                  backgroundColor: "transparent",
                  tension: 0.2,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: CORP_COLORS.orange,
                  pointBorderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Delivery Predictability"),
                legend: legendPlugin,
                datalabels: {
                  display: true,
                  align: "end",
                  anchor: "end",
                  offset: 4,
                  clip: false,
                  color: CORP_COLORS.slate,
                  font: { family: fontFamily, size: 11, weight: 600 },
                  formatter: (v) => (typeof v === "number" ? String(Math.round(v)) : ""),
                },
              },
              scales: {
                x: xScale,
                y: { ...yHidden, max: deliveryMax },
              },
            }}
          />
        </div>

        <div className={cardClass}>
          <Bar
            data={{
              labels: series.labels,
              datasets: [
                {
                  label: "Capacity",
                  data: capData as unknown as number[],
                  backgroundColor: CORP_COLORS.amber,
                  borderWidth: 0,
                  maxBarThickness: 52,
                  order: 2,
                  borderRadius: 4,
                  grouped: false,
                  categoryPercentage: 0.62,
                  barPercentage: 1,
                },
                {
                  label: "Utilization",
                  data: utilData as unknown as number[],
                  backgroundColor: CORP_COLORS.red,
                  borderWidth: 0,
                  maxBarThickness: 28,
                  order: 1,
                  borderRadius: 4,
                  grouped: false,
                  categoryPercentage: 0.62,
                  barPercentage: 1,
                  datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 11 },
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
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Capacity Utilization %"),
                legend: legendPlugin,
                datalabels: { display: false },
              },
              scales: {
                x: xScale,
                y: { ...yHidden, max: capMax },
              },
            }}
          />
        </div>

        <div className={cardClass}>
          <Bar
            data={{
              labels: series.labels,
              datasets: [
                {
                  label: "Customer Value",
                  data: series.valueMix,
                  backgroundColor: CORP_COLORS.amber,
                  borderRadius: 4,
                  maxBarThickness: 48,
                  datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 10 },
                    anchor: "center",
                    align: "center",
                    formatter: (v) => (typeof v === "number" && v > 0 ? String(Math.round(v)) : ""),
                  },
                },
                {
                  label: "Platform / Quality",
                  data: series.enablementMix,
                  backgroundColor: CORP_COLORS.blue,
                  borderRadius: 4,
                  maxBarThickness: 48,
                  datalabels: {
                    color: "#fff",
                    font: { weight: "bold", size: 10 },
                    anchor: "center",
                    align: "center",
                    formatter: (v) => (typeof v === "number" && v > 0 ? String(Math.round(v)) : ""),
                  },
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Value vs Enablement Mix"),
                legend: legendPlugin,
                datalabels: { display: false },
              },
              scales: {
                x: { ...xScale, stacked: true },
                y: { ...yHidden, stacked: true, max: mixMax },
              },
            }}
          />
        </div>

        <div className={cardClass}>
          <Line
            data={{
              labels: series.labels,
              datasets: [
                {
                  label: "Spill over rate %",
                  data: series.spill,
                  borderColor: CORP_COLORS.orange,
                  backgroundColor: "transparent",
                  fill: false,
                  tension: 0.2,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: CORP_COLORS.orange,
                  pointBorderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Spill Over Rate"),
                legend: legendPlugin,
                datalabels: {
                  display: true,
                  align: "end",
                  anchor: "end",
                  offset: 4,
                  clip: false,
                  color: CORP_COLORS.slate,
                  font: { family: fontFamily, size: 11, weight: 600 },
                  formatter: (v) => (typeof v === "number" ? `${v.toFixed(1)}%` : ""),
                },
              },
              scales: {
                x: xScale,
                y: { ...yHidden, max: lineYMax(series.spill) },
              },
            }}
          />
        </div>

        <div className={cardClass}>
          <Line
            data={{
              labels: series.labels,
              datasets: [
                {
                  label: "Spillover rate due to external causes",
                  data: series.bottleneck,
                  borderColor: CORP_COLORS.orange,
                  backgroundColor: "transparent",
                  fill: false,
                  tension: 0.2,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: CORP_COLORS.orange,
                  pointBorderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Bottleneck Indicator"),
                legend: legendPlugin,
                datalabels: {
                  display: true,
                  align: "end",
                  anchor: "end",
                  offset: 4,
                  clip: false,
                  color: CORP_COLORS.slate,
                  font: { family: fontFamily, size: 11, weight: 600 },
                  formatter: (v) => (typeof v === "number" ? `${v.toFixed(1)}%` : ""),
                },
              },
              scales: {
                x: xScale,
                y: { ...yHidden, max: lineYMax(series.bottleneck) },
              },
            }}
          />
        </div>

        <div className={cardClass}>
          <Line
            data={{
              labels: vLabels,
              datasets: [
                {
                  label: "Velocity",
                  data: series.velocity,
                  borderColor: CORP_COLORS.orange,
                  backgroundColor: "transparent",
                  fill: false,
                  tension: 0.2,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointBackgroundColor: "#fff",
                  pointBorderColor: CORP_COLORS.orange,
                  pointBorderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              layout: { padding: { top: 16, right: 8, bottom: 4, left: 8 } },
              plugins: {
                title: titlePlugin("Velocity Trend"),
                legend: legendPlugin,
                datalabels: {
                  display: true,
                  align: "end",
                  anchor: "end",
                  offset: 4,
                  clip: false,
                  color: CORP_COLORS.slate,
                  font: { family: fontFamily, size: 11, weight: 600 },
                  formatter: (v) => (typeof v === "number" ? String(Math.round(v)) : ""),
                },
              },
              scales: {
                x: xScale,
                y: { ...yHidden, max: velMax },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
