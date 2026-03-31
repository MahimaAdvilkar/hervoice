import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateRunWithLLM, evaluateRunHeuristic } from "@/lib/evaluator";
import { getRunById, saveRunEvaluation } from "@/lib/runStore";

export const runtime = "nodejs";

const BodySchema = z.object({
  run_id: z.string().min(1, "run_id is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const run = await getRunById(parsed.run_id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    let evaluation;
    let evaluatorUsed: string;

    // Try Claude judge first; fall back to heuristic if API key missing or call fails
    try {
      evaluation = await evaluateRunWithLLM({ intake: run.intake, final: run.final });
      evaluatorUsed = "claude-judge-v1";
    } catch (llmError: any) {
      console.warn("[evaluate] LLM judge failed, falling back to heuristic:", llmError?.message);
      evaluation = evaluateRunHeuristic({ intake: run.intake, final: run.final });
      evaluatorUsed = "heuristic-v1";
    }

    await saveRunEvaluation(run.id, evaluation);
    return NextResponse.json({ run_id: run.id, evaluation, evaluator_used: evaluatorUsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Evaluation failed" }, { status: 400 });
  }
}
