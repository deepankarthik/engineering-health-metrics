import { NextResponse } from "next/server";
import { aggregateMetrics } from "@/app/lib/aggregate";
import { enrichIterationRecords } from "@/app/lib/computeMetrics";
import { generateAllDashboardCharts } from "@/app/lib/chartGenerator";
import { buildReportPptx } from "@/app/lib/pptGenerator";
import { readMetrics } from "@/app/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/generate/ppt — build report.pptx from stored JSON and return as download.
 */
export async function GET() {
  try {
    const stored = await readMetrics();
    if (!stored.length) {
      return NextResponse.json({ error: "No metrics to report. Submit data first." }, { status: 400 });
    }
    const enriched = enrichIterationRecords(stored);
    const series = aggregateMetrics(enriched);
    const charts = await generateAllDashboardCharts(series);
    const buf = await buildReportPptx(charts);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="report.pptx"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate PowerPoint." }, { status: 500 });
  }
}
