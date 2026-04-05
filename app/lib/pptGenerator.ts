import PptxGenJS from "pptxgenjs";

export type DashboardChartBuffers = {
  deliveryPredictability: Buffer;
  capacityUtilization: Buffer;
  valueEnablement: Buffer;
  spillOver: Buffer;
  bottleneck: Buffer;
  velocity: Buffer;
};

function toPptxImageData(buf: Buffer): string {
  return "image/png;base64," + buf.toString("base64");
}

/**
 * Builds a single 16:9 slide with title and a 2×3 chart grid (corporate dashboard layout).
 */
export async function buildReportPptx(charts: DashboardChartBuffers): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CUSTOM_16x9", width: 10, height: 5.625 });
  pptx.layout = "CUSTOM_16x9";

  const slide = pptx.addSlide();
  slide.background = { color: "F1F5F9" };

  slide.addText("Your Organization Name Here", {
    x: 0.4,
    y: 0.22,
    w: 8.5,
    h: 0.45,
    fontSize: 22,
    color: "334155",
    fontFace: "Arial",
    bold: true,
  });
  slide.addText("Engineering Health Report", {
    x: 0.4,
    y: 0.62,
    w: 8.5,
    h: 0.35,
    fontSize: 13,
    color: "64748B",
    fontFace: "Arial",
  });

  const marginX = 0.35;
  const marginTop = 1.05;
  const marginBottom = 0.42;
  const gapX = 0.12;
  const gapY = 0.1;
  const usableW = 10 - marginX * 2;
  const usableH = 5.625 - marginTop - marginBottom;
  const colW = (usableW - gapX * 2) / 3;
  const rowH = (usableH - gapY) / 2;
  const inset = 0.08;

  const grid = [
    { key: "deliveryPredictability" as const, col: 0, row: 0 },
    { key: "capacityUtilization" as const, col: 1, row: 0 },
    { key: "valueEnablement" as const, col: 2, row: 0 },
    { key: "spillOver" as const, col: 0, row: 1 },
    { key: "bottleneck" as const, col: 1, row: 1 },
    { key: "velocity" as const, col: 2, row: 1 },
  ];

  for (const cell of grid) {
    const x = marginX + cell.col * (colW + gapX);
    const y = marginTop + cell.row * (rowH + gapY);
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: colW,
      h: rowH,
      fill: { type: "solid", color: "FFFFFF" },
      line: { color: "94A3B8", width: 1, dashType: "dash" },
    });
    const buf = charts[cell.key];
    slide.addImage({
      data: toPptxImageData(buf),
      x: x + inset,
      y: y + inset,
      w: colW - inset * 2,
      h: rowH - inset * 2,
    });
  }

  const bx = 9.28;
  const by = 5.12;
  const sw = 0.11;
  const gap = 0.02;

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
