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
} from "@/lib/schemas";
import { createLLMClient, resolveProvider, type LLMClient } from "@/lib/llm";
import { saveRun } from "@/lib/runStore";
import {
  visionPrompt,
  fundingPrompt,
  gtmPrompt,
  roadmapPrompt,
  pitchPrompt,
  fixJsonPrompt,
} from "@/lib/prompts";

type AgentKey = "vision" | "funding" | "gtm" | "roadmap" | "pitch";
type TraceStatus = "started" | "validated" | "retrying" | "completed" | "failed";
type TraceItem = { agent: AgentKey; status: TraceStatus; message?: string; timestamp: string };
type SendFn = (event: object) => void;

const ts = () => new Date().toISOString();

function schemaHintFor(agent: AgentKey): string {
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
  "slides": [{ "title": "string", "bullets": ["string"] }],
  "demo_script_30s": ["string"]
}`;
  }
}

async function runAgent<T>(
  client: LLMClient,
  agent: AgentKey,
  prompt: { system: string; user: string },
  schema: z.ZodType<T>,
  send: SendFn
): Promise<{ data: T; trace: TraceItem[] }> {
  const trace: TraceItem[] = [];
  const addTrace = (status: TraceStatus, message?: string) => {
    trace.push({ agent, status, message, timestamp: ts() });
  };

  send({ type: "agent_started", agent, timestamp: ts() });
  addTrace("started");

  const raw = await client.chat([
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ]);

  try {
    const parsed = schema.parse(JSON.parse(raw));
    addTrace("validated");
    addTrace("completed");
    send({ type: "agent_completed", agent, data: parsed, timestamp: ts() });
    return { data: parsed as T, trace };
  } catch {
    addTrace("retrying", "Fixing JSON schema");
    send({ type: "agent_retrying", agent, message: "Fixing JSON schema", timestamp: ts() });

    const fixUser = fixJsonPrompt(raw, schemaHintFor(agent));
    const raw2 = await client.chat([
      { role: "system", content: prompt.system },
      { role: "user", content: fixUser },
    ]);

    try {
      const parsed2 = schema.parse(JSON.parse(raw2));
      addTrace("validated");
      addTrace("completed");
      send({ type: "agent_completed", agent, data: parsed2, timestamp: ts() });
      return { data: parsed2 as T, trace };
    } catch {
      addTrace("failed", "Schema validation failed after retry");
      send({ type: "agent_failed", agent, error: "Schema validation failed after retry", timestamp: ts() });
      throw new Error(`${agent} agent failed schema validation after retry`);
    }
  }
}

// ── Mock data ────────────────────────────────────────────────────────────────

function buildMockBlueprint() {
  return BlueprintSchema.parse({
    problem_statement: "Early-stage founders need clear positioning and core feature focus to validate demand quickly.",
    target_customer: "Early DTC brands and performance marketers",
    value_proposition: "Concise, actionable plan for validation and first customers",
    unique_angle: "Women-entrepreneurship aware guidance with pragmatic steps",
    core_features: ["Clear problem + value articulation", "Customer discovery questions", "Validation experiment outline"],
    risks: ["Market too broad", "Founder bandwidth limits execution"],
    assumptions: ["Founders have basic digital literacy", "Budget under $5k for validation"],
  });
}

function buildMockFunding() {
  return FundingSchema.parse({
    recommended_funding_path: "Bootstrap + grants + women-focused accelerators",
    top_3_next_steps: ["Identify 5 design partners", "Run 2 validation experiments", "Apply to 2 relevant accelerators"],
    grants_and_programs: ["IFundWomen grants", "SBA Women's Business Center programs", "Cartier Women's Initiative"],
    accelerator_types: ["YCombinator (W/S cohorts)", "Astia Angels", "Springboard Enterprises"],
    bootstrap_strategy: "Leverage no-code tools, community outreach, and paid pilots to reach $5k MRR before raising",
    pitch_focus: ["Problem severity", "Founder credibility", "Early traction metrics"],
    risks_and_mitigations: ["Dilution risk: bootstrap longer", "Runway risk: keep burn under $3k/mo"],
  });
}

function buildMockGTM() {
  return GTMSchema.parse({
    positioning_statement: "AI-powered copilot to help women founders validate demand and acquire first customers in 90 days",
    ideal_early_adopters: ["Solo founders in ideation/prototype stage", "Bootcamp grads starting first company", "Side-hustle-to-startup transitioners"],
    validation_experiments: ["Landing page + waitlist (target 100 signups in 2 weeks)", "Cold outreach with PDF mockup (target 10% reply rate)"],
    first_10_customers_plan: ["Offer 3 free pilots to warm network", "Post in 2 founder communities", "Referral incentive: 1 free month for each referral"],
    channels: ["Twitter/X founder communities", "LinkedIn posts", "Women in Tech Slack groups", "Nextdoor for local service businesses"],
    partnership_ideas: ["Bootcamp partnerships", "SCORE mentorship programs", "Women's business associations"],
    success_metrics: ["5 design partners in 30 days", "10 paid pilots in 60 days", "1 logo customer in 90 days"],
  });
}

function buildMockRoadmap() {
  return RoadmapSchema.parse({
    day_30: ["Run 10 customer discovery calls", "Set up landing page + waitlist", "Define MVP feature scope", "Post 3x/week on LinkedIn"],
    day_60: ["Build and ship MVP v1", "Onboard 5 pilot users", "Collect structured feedback", "Iterate on top 2 pain points"],
    day_90: ["Convert 2 pilots to paid", "Document first case study", "Apply to 1 accelerator", "Reach 50 waitlist signups"],
    milestones: ["First 10 discovery calls completed", "MVP launched to pilots", "First $500 in revenue", "Accelerator application submitted"],
    metrics_to_track: ["Weekly active users", "Discovery call completion rate", "Pilot-to-paid conversion rate", "Net Promoter Score"],
  });
}

function buildMockPitch() {
  const slide = (title: string, bullets: string[]) => ({ title, bullets });
  return PitchDeckSchema.parse({
    one_sentence_vision: "Agentic startup copilot that turns a founder's idea into an executable 90-day plan in minutes.",
    elevator_pitch: "We help women founders move from idea to first revenue with AI-generated plans covering blueprint, funding, GTM, and pitch — all in one place.",
    slides: [
      slide("Problem", ["Validation is slow and expensive", "Generic advice doesn't account for founder constraints", "Women founders lack tailored resources"]),
      slide("Solution", ["5 AI agents generate a full startup plan in minutes", "Plans grounded in women-entrepreneurship best practices", "Actionable 90-day roadmap, not just advice"]),
      slide("Why Now", ["GenAI models are production-ready", "Founder tools market growing 40% YoY", "Women founders receive only 2% of VC funding — they need better tools"]),
      slide("Market", ["40M small businesses in the US", "$12B founder tools market", "2M+ women-owned businesses started annually"]),
      slide("Product", ["Intake form → 5 parallel agents → structured plan", "Export to Markdown, JSON, PPTX", "Run history + quality evaluation"]),
      slide("Go-To-Market", ["Start with founder communities", "Partner with bootcamps and SCORE", "Freemium → $29/mo pro plan"]),
      slide("Business Model", ["Free: 3 plans/mo", "Pro: $29/mo unlimited", "Team: $99/mo with collaboration"]),
      slide("Ask / Next Steps", ["Seeking 5 design partners", "Target: $5k MRR in 90 days", "Raising $150k pre-seed from angels"]),
    ],
    demo_script_30s: [
      "Fill in your idea and context (30 seconds)",
      "5 agents run in parallel — watch them complete live",
      "Get a full plan: blueprint, funding, GTM, roadmap, pitch deck",
      "Export to PPTX for your next investor meeting",
    ],
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream already closed (client disconnected)
        }
      };

      try {
        const url = new URL(req.url);
        const mockMode = url.searchParams.get("mock") === "true" || process.env.MOCK_MODE === "true";
        const body = await req.json();
        const intake = IntakeSchema.parse(body);
        const provider = resolveProvider();

        if (mockMode) {
          const agents: AgentKey[] = ["vision", "funding", "gtm", "roadmap", "pitch"];

          // All agents "start" immediately (simulates parallel kick-off)
          for (const agent of agents) {
            send({ type: "agent_started", agent, timestamp: ts() });
          }

          const mockDataMap: Record<AgentKey, object> = {
            vision: buildMockBlueprint(),
            funding: buildMockFunding(),
            gtm: buildMockGTM(),
            roadmap: buildMockRoadmap(),
            pitch: buildMockPitch(),
          };

          // Staggered completions simulate real parallel latency
          const delays: Record<AgentKey, number> = {
            vision: 900,
            funding: 1400,
            gtm: 1100,
            roadmap: 1600,
            pitch: 1250,
          };

          await Promise.all(
            agents.map(async (agent) => {
              await new Promise((r) => setTimeout(r, delays[agent]));
              send({ type: "agent_completed", agent, data: mockDataMap[agent], timestamp: ts() });
            })
          );

          const final = FinalResponseSchema.parse({
            blueprint: mockDataMap.vision,
            funding: mockDataMap.funding,
            gtm: mockDataMap.gtm,
            roadmap: mockDataMap.roadmap,
            pitch_deck: mockDataMap.pitch,
            agent_trace: agents.map((a) => ({
              agent: a,
              status: "completed",
              message: "Mock mode",
              timestamp: ts(),
            })),
          });

          const run = await saveRun({ provider: "mock", mode: "mock", intake, final });
          send({ type: "done", final, run_id: run.id });
          return;
        }

        // ── Live mode ────────────────────────────────────────────────────────
        const client = createLLMClient();

        const [v, f, g, r, p] = await Promise.all([
          runAgent(client, "vision", visionPrompt(intake), BlueprintSchema, send),
          runAgent(client, "funding", fundingPrompt(intake), FundingSchema, send),
          runAgent(client, "gtm", gtmPrompt(intake), GTMSchema, send),
          runAgent(client, "roadmap", roadmapPrompt(intake), RoadmapSchema, send),
          runAgent(client, "pitch", pitchPrompt(intake), PitchDeckSchema, send),
        ]);

        const allTrace = [...v.trace, ...f.trace, ...g.trace, ...r.trace, ...p.trace];

        const final = FinalResponseSchema.parse({
          blueprint: v.data,
          funding: f.data,
          gtm: g.data,
          roadmap: r.data,
          pitch_deck: p.data,
          agent_trace: allTrace,
        });

        const run = await saveRun({ provider, mode: "live", intake, final });
        send({ type: "done", final, run_id: run.id });
      } catch (error: any) {
        send({ type: "error", error: error.message ?? "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
