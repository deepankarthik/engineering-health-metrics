import { NextResponse } from "next/server";
import { clearMetrics } from "@/app/lib/storage";

export const runtime = "nodejs";

/** POST /api/clear — reset stored metrics (bonus: clear all data). */
export async function POST() {
  try {
    await clearMetrics();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to clear data." }, { status: 500 });
  }
}
