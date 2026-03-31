import { NextResponse } from "next/server";
import { listRuns } from "@/lib/runStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const runs = await listRuns();
    const items = runs.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      provider: r.provider,
      mode: r.mode,
      founderName: r.intake.founderName,
      idea: r.intake.idea,
      stage: r.intake.stage,
      evaluation: r.evaluation
        ? {
            overall_score: r.evaluation.overall_score,
            evaluated_at: r.evaluation.evaluated_at,
          }
        : null,
    }));
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to load runs" }, { status: 500 });
  }
}
