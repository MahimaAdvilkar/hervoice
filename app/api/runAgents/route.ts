import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { z } from "zod";
import {
  IntakeSchema,
  BlueprintSchema,
  FundingSchema,
  GTMSchema,
  RoadmapSchema,
  PitchDeckSchema,
  FinalResponseSchema,
  AgentTraceItemSchema,
} from "@/lib/schemas";
import { createLLMClient, resolveProvider, type LLMClient } from "@/lib/llm";
import { saveRun } from "@/lib/runStore";
import { visionPrompt, fundingPrompt, gtmPrompt, roadmapPrompt, pitchPrompt, fixJsonPrompt } from "@/lib/prompts";

type AgentKey = "vision" | "funding" | "gtm" | "roadmap" | "pitch";

function trace(agent: AgentKey, status: z.infer<typeof AgentTraceItemSchema>["status"], message?: string) {
  return { agent, status, message, timestamp: new Date().toISOString() };
}

function schemaHintFor(agent: AgentKey) {
  switch (agent) {
    case "vision":
      return `{
  "problem_statement": "string",
  "target_customer": "string",
  "value_proposition": "string",
  "unique_angle": "string",
  "core_features": ["string"],
  "risks": ["string"],
  "assumptions": ["string"]
}`;
    case "funding":
      return `{
  "recommended_funding_path": "string",
  "top_3_next_steps": ["string"],
  "grants_and_programs": ["string"],
  "accelerator_types": ["string"],
  "bootstrap_strategy": "string",
  "pitch_focus": ["string"],
  "risks_and_mitigations": ["string"]
}`;
    case "gtm":
      return `{
  "positioning_statement": "string",
  "ideal_early_adopters": ["string"],
  "validation_experiments": ["string"],
  "first_10_customers_plan": ["string"],
  "channels": ["string"],
  "partnership_ideas": ["string"],
  "success_metrics": ["string"]
}`;
    case "roadmap":
      return `{
  "day_30": ["string"],
  "day_60": ["string"],
  "day_90": ["string"],
  "milestones": ["string"],
  "metrics_to_track": ["string"]
}`;
    case "pitch":
      return `{
  "one_sentence_vision": "string",
  "elevator_pitch": "string",
  "slides": [
    { "title": "string", "bullets": ["string"] }
  ],
  "demo_script_30s": ["string"]
}`;
  }
}

async function runAgent<T>(client: LLMClient, agent: AgentKey, prompt: { system: string; user: string }, schema: z.ZodType<T>) {
  const steps: ReturnType<typeof trace>[] = [];
  steps.push(trace(agent, "started"));

  const raw = await client.chat([
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ]);

  try {
    const parsed = schema.parse(JSON.parse(raw));
    steps.push(trace(agent, "validated"));
    steps.push(trace(agent, "completed"));
    return { data: parsed as T, steps };
  } catch (e) {
    steps.push(trace(agent, "retrying", "Fixing JSON schema"));
    const fixUser = fixJsonPrompt(raw, schemaHintFor(agent)!);
    const raw2 = await client.chat([
      { role: "system", content: prompt.system },
      { role: "user", content: fixUser },
    ]);
    try {
      const parsed2 = schema.parse(JSON.parse(raw2));
      steps.push(trace(agent, "validated"));
      steps.push(trace(agent, "completed"));
      return { data: parsed2 as T, steps };
    } catch (e2) {
      // Fallback: synthesize minimal valid JSON for demo reliability
      steps.push(trace(agent, "failed", "Using fallback content"));
      const fallback = buildFallback(agent);
      const parsedFallback = schema.parse(fallback);
      steps.push(trace(agent, "validated"));
      steps.push(trace(agent, "completed", "Fallback applied"));
      return { data: parsedFallback as T, steps };
    }
  }
}

function buildFallback(agent: AgentKey) {
  if (agent === "vision") {
    return {
      problem_statement: "Early-stage founders need clear positioning and core feature focus to validate demand quickly.",
      target_customer: "Early DTC brands and performance marketers",
      value_proposition: "Concise, actionable plan for validation and first customers",
      unique_angle: "Women-entrepreneurship aware guidance with pragmatic steps",
      core_features: [
        "Clear problem + value articulation",
        "Customer discovery questions",
        "Validation experiment outline",
      ],
      risks: [],
      assumptions: [],
    };
  }
  if (agent === "funding") {
    return {
      recommended_funding_path: "Bootstrap + grants + women-focused accelerators",
      top_3_next_steps: [
        "Identify 5 design partners",
        "Run 2 validation experiments",
        "Apply to 2 relevant accelerators",
      ],
      grants_and_programs: [],
      accelerator_types: [],
      bootstrap_strategy: "Leverage no-code, community outreach, and pilots",
      pitch_focus: [],
      risks_and_mitigations: [],
    };
  }
  if (agent === "gtm") {
    return {
      positioning_statement: "AI-powered solution to validate and acquire first customers efficiently",
      ideal_early_adopters: ["DTC brands", "Performance marketing agencies"],
      validation_experiments: ["Landing page + waitlist", "Cold outreach with mockups"],
      first_10_customers_plan: ["Offer pilot to 5 partners", "Referral loop to 5 more"],
      channels: ["Twitter/X", "LinkedIn", "Founder communities"],
      partnership_ideas: ["Agencies", "Founder groups"],
      success_metrics: ["5 design partners", "10 pilots", "1 paid logo"],
    };
  }
  if (agent === "roadmap") {
    const list = [
      "Customer discovery calls",
      "Waitlist + landing page",
      "Pilot outreach",
      "MVP scope + build",
      "Feedback loops",
      "Case study drafting",
      "First paid conversion",
    ];
    return {
      day_30: list.slice(0, 4),
      day_60: list.slice(0, 5),
      day_90: list.slice(0, 5),
      milestones: list.slice(0, 5),
      metrics_to_track: list.slice(0, 5),
    };
  }
  // pitch
  const slide = (title: string, bullets: string[]) => ({ title, bullets: bullets.slice(0, 5) });
  return {
    one_sentence_vision: "Agentic startup copilot to validate and win first customers.",
    elevator_pitch: "We help women founders validate demand and get to first revenue with pragmatic, data-backed plans.",
    slides: [
      slide("Problem", ["Validation is slow", "Creative costs high", "Uncertain GTM"]),
      slide("Solution", ["Agentic copilot", "Actionable plans", "Fast iterations"]),
      slide("Why Now", ["GenAI maturity", "Founder tools growth", "Community reach"]),
      slide("Market", ["DTC + SMB", "Martech", "Founder tools"]),
      slide("Product", ["Planning agents", "Schema outputs", "Roadmaps"]),
      slide("Go-To-Market", ["Communities", "Agencies", "Pilots"]),
      slide("Business Model", ["SaaS tiers", "Pilot bundles", "Advisory"]),
      slide("Ask / Next Steps", ["5 partners", "10 pilots", "1 paid logo"]),
    ],
    demo_script_30s: [
      "Fill intake, run agents, get JSON plans",
      "Share with partners, iterate, convert",
    ],
  };
}

export async function POST(req: Request) {
  const buildMockFinal = () => {
    const blueprint = BlueprintSchema.parse(buildFallback("vision"));
    const funding = FundingSchema.parse(buildFallback("funding"));
    const gtm = GTMSchema.parse(buildFallback("gtm"));
    const roadmap = RoadmapSchema.parse(buildFallback("roadmap"));
    const pitch = PitchDeckSchema.parse(buildFallback("pitch"));
    return {
      blueprint,
      funding,
      gtm,
      roadmap,
      pitch_deck: pitch,
      agent_trace: [
        trace("vision", "completed", "Mock mode"),
        trace("funding", "completed", "Mock mode"),
        trace("gtm", "completed", "Mock mode"),
        trace("roadmap", "completed", "Mock mode"),
        trace("pitch", "completed", "Mock mode"),
      ],
    };
  };

  try {
    const url = new URL(req.url);
    const mockParam = url.searchParams.get("mock");
    const mockMode = (mockParam === "true") || (process.env.MOCK_MODE === "true");
    const body = await req.json();
    const intake = IntakeSchema.parse(body);

    const provider = resolveProvider();
    let mode: "live" | "mock" | "fallback" = "live";

    if (mockMode) {
      mode = "mock";
      const final = buildMockFinal();
      const validated = FinalResponseSchema.parse(final);
      const run = await saveRun({ provider, mode, intake, final: validated });
      return NextResponse.json({ ...validated, run_id: run.id });
    }

    let final: any;
    try {
      const client = createLLMClient();
      const traceItems: ReturnType<typeof trace>[] = [];

      // Run agents in parallel to reduce end-to-end latency
      const [v, f, g, r, p] = await Promise.all([
        runAgent(client, "vision", visionPrompt(intake), BlueprintSchema),
        runAgent(client, "funding", fundingPrompt(intake), FundingSchema),
        runAgent(client, "gtm", gtmPrompt(intake), GTMSchema),
        runAgent(client, "roadmap", roadmapPrompt(intake), RoadmapSchema),
        runAgent(client, "pitch", pitchPrompt(intake), PitchDeckSchema),
      ]);
      traceItems.push(...v.steps, ...f.steps, ...g.steps, ...r.steps, ...p.steps);

      final = {
        blueprint: v.data,
        funding: f.data,
        gtm: g.data,
        roadmap: r.data,
        pitch_deck: p.data,
        agent_trace: traceItems,
      };
    } catch (llmError: any) {
      final = buildMockFinal();
      mode = "fallback";
      final.agent_trace = final.agent_trace.map((item: any) => ({
        ...item,
        message: `Fallback after ${provider} API failure: ${llmError?.message ?? "unknown"}`,
      }));
    }

    const validated = FinalResponseSchema.parse(final);
    const run = await saveRun({ provider, mode, intake, final: validated });
    return NextResponse.json({ ...validated, run_id: run.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 400 });
  }
}
