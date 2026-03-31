import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BlueprintSchema,
  FundingSchema,
  GTMSchema,
  RoadmapSchema,
  PitchDeckSchema,
  IntakeSchema,
} from "@/lib/schemas";
import { createLLMClient } from "@/lib/llm";
import { refinePrompt, fixJsonPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

const SECTION_SCHEMAS = {
  blueprint: BlueprintSchema,
  funding:   FundingSchema,
  gtm:       GTMSchema,
  roadmap:   RoadmapSchema,
  pitch:     PitchDeckSchema,
} as const;

type Section = keyof typeof SECTION_SCHEMAS;

const BodySchema = z.object({
  intake:   IntakeSchema,
  section:  z.enum(["blueprint", "funding", "gtm", "roadmap", "pitch"]),
  feedback: z.string().min(3, "Please provide at least a short feedback"),
  current:  z.record(z.unknown()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);
    const { intake, section, feedback, current } = parsed;

    const schema = SECTION_SCHEMAS[section as Section];
    const prompt = refinePrompt(section, intake, current, feedback);

    const client = createLLMClient();

    const raw = await client.chat([
      { role: "system", content: prompt.system },
      { role: "user",   content: prompt.user },
    ]);

    let result: unknown;
    try {
      result = schema.parse(JSON.parse(raw));
    } catch {
      // Retry with fix prompt
      const fixUser = fixJsonPrompt(raw);
      const raw2 = await client.chat([
        { role: "system", content: prompt.system },
        { role: "user",   content: fixUser },
      ]);
      result = schema.parse(JSON.parse(raw2));
    }

    return NextResponse.json({ section, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Refinement failed" },
      { status: 400 }
    );
  }
}
