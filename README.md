# Engineering Health Metrics

Next.js (App Router) internal tool: managers submit **iteration-level** inputs, the **server computes KPIs**, the UI previews six Chart.js charts, and you download **`report.pptx`** (PptxGenJS) or **`report.pdf`** (Puppeteer) in a **2×3** corporate layout.

## Run

```bash
cd engineering-metrics
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech

- Next.js 15, TypeScript, Tailwind  
- Preview: Chart.js + react-chartjs-2  
- Server PNGs: chartjs-node-canvas  
- PPT: PptxGenJS · PDF: Puppeteer  
- Storage: `data/metrics.json` (raw inputs only)

## Stored fields (per iteration)

| Field | Type |
|--------|------|
| `iteration` | string |
| `committedStoryPoints` | int ≥ 0 |
| `deliveredStoryPoints` | int ≥ 0 |
| `capacity` | int ≥ 0 |
| `spillOverTotalStoryPoints` | int ≥ 0 |
| `spillOverTotalStories` | int ≥ 0 |
| `spillOverDependencyStoryPoints` | int ≥ 0 |
| `spillOverDependencyStories` | int ≥ 0 |

## Computed KPIs (`app/lib/computeMetrics.ts`)

- **Velocity** = delivered story points  
- **Utilization %** = `(delivered / capacity) × 100` (0 if capacity = 0), **1 decimal**  
- **Spill over rate %** = `(spill total SP / committed SP) × 100` (0 if committed = 0), **1 decimal**  
- **Bottleneck %** = `(dependency spill SP / spill total SP) × 100` (0 if spill total = 0), **1 decimal**  
- **Target** = constant **90** story points (delivery predictability chart)

No `NaN` / `Infinity`: safe ratios and non-negative clamps.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/submit` | Save raw row; returns `{ computed }` |
| `GET` | `/api/data` | All rows + flattened KPIs; optional `?q=` or `?month=` filter |
| `GET` | `/api/generate/ppt` | `report.pptx` |
| `GET` | `/api/generate/pdf` | `report.pdf` |
| `POST` | `/api/clear` | Clear JSON file |

## Layout

- `app/lib/computeMetrics.ts` — `computeMetrics`, `enrichIterationRecords`  
- `app/lib/chartGenerator.ts` — `generateLineChart`, `generateBarChart`, `generateStackedChart`, `generateCapacityUtilizationChart`  
- `app/lib/pptGenerator.ts`, `app/lib/pdfGenerator.ts`  
- `components/MetricsForm.tsx`, `components/Dashboard.tsx`

**Value vs Enablement** is an illustrative stacked split derived from delivered work (placeholder — not a separate form field). If all delivered are zero, a small static mock is used so the chart is visible.

## Native deps

`chartjs-node-canvas` → **canvas**; **Puppeteer** downloads Chromium. On Linux, install build tools / Cairo packages if `canvas` fails to compile.
