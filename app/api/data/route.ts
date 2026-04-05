import { NextResponse } from "next/server";
import { enrichIterationRecords } from "@/app/lib/computeMetrics";
import { readMetrics } from "@/app/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/data — all stored rows enriched with server-computed KPIs.
 * Optional ?q= substring filter on iteration label (preview / search).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? searchParams.get("month")?.trim();
    let rows = await readMetrics();
    if (q) {
      const ql = q.toLowerCase();
      rows = rows.filter((r) => r.iteration.toLowerCase().includes(ql));
    }
    const enriched = enrichIterationRecords(rows);
    return NextResponse.json(enriched);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to read metrics." }, { status: 500 });
  }
}
