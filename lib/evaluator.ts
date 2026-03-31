import { EvaluationResultSchema, type EvaluationResult, type FinalResponse, type Intake } from "@/lib/schemas";

// ── Shared helpers ────────────────────────────────────────────────────────────

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(items: number[]) {
  if (!items.length) return 0;
  return items.reduce((a, b) => a + b, 0) / items.length;
}

function hasConcreteAction(text: string) {
  return /(run|build|launch|test|reach out|interview|measure|validate|apply|ship|create|track)/i.test(text);
}

// ── Heuristic evaluator (offline fallback) ───────────────────────────────────

export function evaluateRunHeuristic(input: { intake: Intake; final: FinalResponse }): EvaluationResult {
  const { final } = input;

  const actionItems = [
    ...final.funding.top_3_next_steps,
    ...final.gtm.validation_experiments,
    ...final.gtm.first_10_customers_plan,
    ...final.roadmap.day_30,
  ];
  const actionabilityScore = clamp(avg(actionItems.map((s) => (hasConcreteAction(s) ? 100 : 60))));

  const sectionCompleteness = [
    final.blueprint.core_features.length >= 1 ? 100 : 40,
    final.funding.top_3_next_steps.length >= 3 ? 100 : 65,
    final.gtm.channels.length >= 2 ? 100 : 70,
    final.roadmap.day_30.length >= 4 ? 100 : 60,
    final.pitch_deck.slides.length === 8 ? 100 : 50,
  ];
  const consistencyScore = clamp(avg(sectionCompleteness));

  const textChunks = [
    final.blueprint.problem_statement,
    final.blueprint.value_proposition,
    final.funding.recommended_funding_path,
    final.gtm.positioning_statement,
  ];
  const specificityScore = clamp(avg(textChunks.map((t) => (t.length >= 45 ? 100 : t.length >= 25 ? 75 : 55))));

  const hasRiskSection =
    final.blueprint.risks.length > 0 ||
    final.funding.risks_and_mitigations.length > 0 ||
    final.blueprint.assumptions.length > 0;
  const riskClarityScore = hasRiskSection ? 85 : 55;

  const overallScore = clamp(avg([actionabilityScore, consistencyScore, specificityScore, riskClarityScore]));

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (actionabilityScore >= 80) strengths.push("Includes concrete next-step actions for validation and go-to-market.");
  else weaknesses.push("Several steps are generic — make them more execution-ready.");

  if (consistencyScore >= 80) strengths.push("Sections are structurally complete and aligned.");
  else weaknesses.push("Some sections are under-specified or missing expected detail.");

  if (specificityScore >= 80) strengths.push("Core statements are specific enough to guide execution.");
  else weaknesses.push("Core strategy statements need more precise detail and differentiation.");

  if (riskClarityScore >= 80) strengths.push("Risks and mitigations are represented in the plan.");
  else weaknesses.push("Risk analysis is weak; add assumptions, risks, and mitigation steps.");

  return EvaluationResultSchema.parse({
    overall_score: overallScore,
    actionability_score: actionabilityScore,
    consistency_score: consistencyScore,
    specificity_score: specificityScore,
    risk_clarity_score: riskClarityScore,
    strengths,
    weaknesses,
    next_improvements: [
      "Add 3 quantified success targets (e.g. leads/week, conversion %, pilot count).",
      "Map each 30-day roadmap item to one owner and one measurable outcome.",
      "Expand risk register with probability, impact, and mitigation owner.",
    ],
    evaluated_at: new Date().toISOString(),
    evaluator: "heuristic-v1",
  });
}

// ── LLM-as-judge evaluator ────────────────────────────────────────────────────

function buildJudgePrompt(intake: Intake, final: FinalResponse): string {
  return `You are an expert startup mentor and plan evaluator. A founder has generated a startup plan using AI agents.
Your job is to critically evaluate the plan quality across 4 dimensions and return a JSON evaluation.

## Founder Context
- Name: ${intake.founderName}
- Idea: ${intake.idea}
- Target Customer: ${intake.targetCustomer}
- Stage: ${intake.stage}
- Region: ${intake.region}
- Industry: ${intake.industry}
- Goals: ${intake.goals || "Not specified"}
- Constraints: ${intake.constraints || "Not specified"}
- Biggest Challenge: ${intake.challenge || "Not specified"}

## Generated Plan

### Blueprint
- Problem: ${final.blueprint.problem_statement}
- Value Proposition: ${final.blueprint.value_proposition}
- Unique Angle: ${final.blueprint.unique_angle}
- Core Features: ${final.blueprint.core_features.join(", ")}
- Risks: ${final.blueprint.risks.join(", ") || "None listed"}
- Assumptions: ${final.blueprint.assumptions.join(", ") || "None listed"}

### Funding
- Recommended Path: ${final.funding.recommended_funding_path}
- Next Steps: ${final.funding.top_3_next_steps.join(" | ")}
- Grants & Programs: ${final.funding.grants_and_programs.join(", ") || "None"}
- Accelerators: ${final.funding.accelerator_types.join(", ") || "None"}
- Bootstrap Strategy: ${final.funding.bootstrap_strategy}
- Risks & Mitigations: ${final.funding.risks_and_mitigations.join(", ") || "None listed"}

### Go-To-Market
- Positioning: ${final.gtm.positioning_statement}
- Early Adopters: ${final.gtm.ideal_early_adopters.join(", ")}
- Validation Experiments: ${final.gtm.validation_experiments.join(" | ")}
- First 10 Customers Plan: ${final.gtm.first_10_customers_plan.join(" | ")}
- Channels: ${final.gtm.channels.join(", ")}
- Success Metrics: ${final.gtm.success_metrics.join(", ")}

### 90-Day Roadmap
- Day 0-30: ${final.roadmap.day_30.join(" | ")}
- Day 31-60: ${final.roadmap.day_60.join(" | ")}
- Day 61-90: ${final.roadmap.day_90.join(" | ")}
- Milestones: ${final.roadmap.milestones.join(" | ")}
- Metrics: ${final.roadmap.metrics_to_track.join(", ")}

---

## Scoring Rubric

**actionability_score (0–100):** Do the next steps, validation experiments, and roadmap tasks have concrete verbs and measurable outcomes? Are they doable by a solo founder in the given constraints?

**specificity_score (0–100):** Are the problem statement, positioning, and value proposition specific to this founder's context, or are they generic/vague? Does it account for region, industry, and stage?

**consistency_score (0–100):** Is the plan internally coherent? Do the GTM channels match the target customer? Does the roadmap serve the funding strategy? Are milestones aligned with 90-day tasks?

**risk_clarity_score (0–100):** Are risks, assumptions, and failure modes surfaced explicitly with mitigations? Is the founder prepared for the most likely blockers?

Score each honestly — do not inflate. A score of 70 means "decent but improvable." 90+ means "this plan could go straight to execution."

## Output format — return ONLY this JSON, no other text:
{
  "overall_score": <average of the 4 scores>,
  "actionability_score": <0-100>,
  "specificity_score": <0-100>,
  "consistency_score": <0-100>,
  "risk_clarity_score": <0-100>,
  "strengths": ["specific strength 1 (cite actual content from the plan)", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1 (cite what's missing or vague)", "specific weakness 2", "specific weakness 3"],
  "next_improvements": [
    "Concrete improvement 1 for this specific founder (actionable, do-this-week)",
    "Concrete improvement 2",
    "Concrete improvement 3"
  ]
}`;
}

function extractJson(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in LLM response");
  return raw.slice(firstBrace, lastBrace + 1);
}

export async function evaluateRunWithLLM(input: { intake: Intake; final: FinalResponse }): Promise<EvaluationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set — cannot run LLM evaluation");

  const prompt = buildJudgePrompt(input.intake, input.final);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 1024,
      temperature: 0.1,
      system: "You are an expert startup mentor. Evaluate the plan and return ONLY valid JSON — no markdown, no commentary.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const textContent = (json?.content ?? []).filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n");

  const parsed = JSON.parse(extractJson(textContent));

  // Clamp all scores to 0–100 in case the model drifts
  const safe = (v: unknown, fallback = 70) => clamp(typeof v === "number" ? v : fallback);

  const actionability_score = safe(parsed.actionability_score);
  const specificity_score = safe(parsed.specificity_score);
  const consistency_score = safe(parsed.consistency_score);
  const risk_clarity_score = safe(parsed.risk_clarity_score);
  const overall_score = clamp(Math.round(avg([actionability_score, specificity_score, consistency_score, risk_clarity_score])));

  return EvaluationResultSchema.parse({
    overall_score,
    actionability_score,
    specificity_score,
    consistency_score,
    risk_clarity_score,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [],
    next_improvements: Array.isArray(parsed.next_improvements) ? parsed.next_improvements.slice(0, 5) : [],
    evaluated_at: new Date().toISOString(),
    evaluator: "claude-judge-v1",
  });
}
