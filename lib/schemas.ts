import { z } from "zod";

// Intake form schema
export const IntakeSchema = z.object({
  founderName: z.string().min(1, "Founder name is required"),
  idea: z.string().min(10, "Describe your idea (min 10 chars)"),
  targetCustomer: z.string().min(3, "Target customer required"),
  stage: z.enum(["ideation", "prototype", "beta", "launched"]).default("ideation"),
  region: z.string().min(2, "Region required"),
  industry: z.string().min(2, "Industry required"),
  goals: z.string().optional().default(""),
  constraints: z.string().optional().default(""),
  challenge: z.string().optional().default("")
});

export type Intake = z.infer<typeof IntakeSchema>;

// Agent outputs
export const BlueprintSchema = z.object({
  problem_statement: z.string(),
  target_customer: z.string(),
  value_proposition: z.string(),
  unique_angle: z.string(),
  core_features: z.array(z.string()).min(1),
  risks: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([])
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

export const FundingSchema = z.object({
  recommended_funding_path: z.string(),
  top_3_next_steps: z.array(z.string()).min(1).max(3),
  grants_and_programs: z.array(z.string()).default([]),
  accelerator_types: z.array(z.string()).default([]),
  bootstrap_strategy: z.string(),
  pitch_focus: z.array(z.string()).default([]),
  risks_and_mitigations: z.array(z.string()).default([])
});
export type Funding = z.infer<typeof FundingSchema>;

export const GTMSchema = z.object({
  positioning_statement: z.string(),
  ideal_early_adopters: z.array(z.string()).default([]),
  validation_experiments: z.array(z.string()).default([]),
  first_10_customers_plan: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  partnership_ideas: z.array(z.string()).default([]),
  success_metrics: z.array(z.string()).default([])
});
export type GTM = z.infer<typeof GTMSchema>;

export const RoadmapSchema = z.object({
  day_30: z.array(z.string()).min(4).max(7),
  day_60: z.array(z.string()).min(4).max(7),
  day_90: z.array(z.string()).min(4).max(7),
  milestones: z.array(z.string()).min(4).max(7),
  metrics_to_track: z.array(z.string()).min(4).max(7)
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const PitchDeckSchema = z.object({
  one_sentence_vision: z.string(),
  elevator_pitch: z.string(),
  slides: z.array(z.object({
    title: z.string(),
    bullets: z.array(z.string()).min(3).max(5)
  })).length(8),
  demo_script_30s: z.array(z.string()).default([])
});
export type PitchDeck = z.infer<typeof PitchDeckSchema>;

export const AgentTraceItemSchema = z.object({
  agent: z.enum(["vision", "funding", "gtm", "roadmap", "pitch"]),
  status: z.enum(["started", "validated", "retrying", "completed", "failed"]),
  message: z.string().optional(),
  timestamp: z.string()
});

export const FinalResponseSchema = z.object({
  blueprint: BlueprintSchema,
  funding: FundingSchema,
  gtm: GTMSchema,
  roadmap: RoadmapSchema,
  pitch_deck: PitchDeckSchema,
  agent_trace: z.array(AgentTraceItemSchema)
});
export type FinalResponse = z.infer<typeof FinalResponseSchema>;

export const RunRecordSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  provider: z.string(),
  mode: z.enum(["live", "mock", "fallback"]),
  intake: IntakeSchema,
  final: FinalResponseSchema,
  evaluation: z.object({
    overall_score: z.number().min(0).max(100),
    actionability_score: z.number().min(0).max(100),
    consistency_score: z.number().min(0).max(100),
    specificity_score: z.number().min(0).max(100),
    risk_clarity_score: z.number().min(0).max(100),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    next_improvements: z.array(z.string()).default([]),
    evaluated_at: z.string(),
    evaluator: z.string(),
  }).optional(),
});
export type RunRecord = z.infer<typeof RunRecordSchema>;

export const EvaluationResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  actionability_score: z.number().min(0).max(100),
  consistency_score: z.number().min(0).max(100),
  specificity_score: z.number().min(0).max(100),
  risk_clarity_score: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  next_improvements: z.array(z.string()).default([]),
  evaluated_at: z.string(),
  evaluator: z.string(),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
