import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RunRecordSchema, type FinalResponse, type Intake, type RunRecord } from "@/lib/schemas";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "runs.json");
const MAX_RUNS = 100;

async function readRuns(): Promise<RunRecord[]> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) return [];
    return json
      .map((item) => RunRecordSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}

async function writeRuns(runs: RunRecord[]) {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(runs, null, 2), "utf8");
}

export async function saveRun(input: {
  provider: string;
  mode: "live" | "mock" | "fallback";
  intake: Intake;
  final: FinalResponse;
}): Promise<RunRecord> {
  const now = new Date().toISOString();
  const run: RunRecord = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: now,
    provider: input.provider,
    mode: input.mode,
    intake: input.intake,
    final: input.final,
  };
  const existing = await readRuns();
  const next = [run, ...existing].slice(0, MAX_RUNS);
  await writeRuns(next);
  return run;
}

export async function listRuns(): Promise<RunRecord[]> {
  return readRuns();
}

export async function getRunById(id: string): Promise<RunRecord | null> {
  const runs = await readRuns();
  return runs.find((r) => r.id === id) ?? null;
}
