import puppeteer from "puppeteer";
import type { DashboardChartBuffers } from "./pptGenerator";

function toDataUri(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function buildDashboardHtml(charts: DashboardChartBuffers): string {
  const d = {
    c1: toDataUri(charts.deliveryPredictability),
    c2: toDataUri(charts.capacityUtilization),
    c3: toDataUri(charts.valueEnablement),
    c4: toDataUri(charts.spillOver),
    c5: toDataUri(charts.bottleneck),
    c6: toDataUri(charts.velocity),
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 32px;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
    }
    .header { margin-bottom: 18px; }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #334155;
      margin: 0 0 4px 0;
      letter-spacing: 0.01em;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, auto);
      gap: 12px;
      align-items: stretch;
    }
    .cell {
      background: #fff;
      border: 1px dashed #94a3b8;
      border-radius: 2px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 220px;
    }
    .cell img { width: 100%; height: auto; display: block; }
    .brand {
      position: fixed;
      right: 28px;
      bottom: 20px;
      display: flex;
      gap: 4px;
    }
    .brand span {
      display: block;
      width: 12px;
      height: 12px;
    }
    .b1 { background: #e11d48; }
    .b2 { background: #f59e0b; }
    .b3 { background: #2563eb; }
    .b4 { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="header">
    <p class="title">Your Organization Name Here</p>
    <p class="subtitle">Engineering Health Report</p>
  </div>
  <div class="grid">
    <div class="cell"><img alt="Delivery Predictability" src="${d.c1}" /></div>
    <div class="cell"><img alt="Capacity Utilization" src="${d.c2}" /></div>
    <div class="cell"><img alt="Value vs Enablement" src="${d.c3}" /></div>
    <div class="cell"><img alt="Spill Over" src="${d.c4}" /></div>
    <div class="cell"><img alt="Bottleneck" src="${d.c5}" /></div>
    <div class="cell"><img alt="Velocity" src="${d.c6}" /></div>
  </div>
  <div class="brand" aria-hidden="true">
    <span class="b1"></span><span class="b2"></span><span class="b3"></span><span class="b4"></span>
  </div>
</body>
</html>`;
}

/**
 * Renders the same 2×3 dashboard as HTML and prints to PDF via headless Chromium.
 */
export async function buildReportPdf(charts: DashboardChartBuffers): Promise<Buffer> {
  const html = buildDashboardHtml(charts);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
