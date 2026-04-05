import { promises as fs } from "fs";
import path from "path";
import type { IterationStored } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "metrics.json");

const DEFAULT_ROLLING_MAX = 5;
const ROLLING_CAP = 500;

/** FIFO cap: keep at most this many rows (oldest dropped first). Override with MAX_ITERATION_ROWS. */
export function getMaxIterationRows(): number {
  const raw = process.env.MAX_ITERATION_ROWS;
  if (raw == null || raw === "") return DEFAULT_ROLLING_MAX;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_ROLLING_MAX;
  return Math.min(n, ROLLING_CAP);
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function readMetrics(): Promise<IterationStored[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as IterationStored[];
  } catch {
    return [];
  }
}

export async function writeMetrics(entries: IterationStored[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function appendMetric(entry: IterationStored): Promise<IterationStored[]> {
  const current = await readMetrics();
  const cap = getMaxIterationRows();
  const next = [...current, entry].slice(-cap);
  await writeMetrics(next);
  return next;
}

export async function clearMetrics(): Promise<void> {
  await ensureDataFile();
  await writeMetrics([]);
}
