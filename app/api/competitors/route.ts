import { NextResponse } from "next/server";
import { IntakeSchema, CompetitorAnalysisSchema } from "@/lib/schemas";
import { createLLMClient } from "@/lib/llm";
import { competitorPrompt, fixJsonPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const intake = IntakeSchema.parse(body?.intake);

    const prompt = competitorPrompt(intake);
    const client = createLLMClient();

    const raw = await client.chat([
      { role: "system", content: prompt.system },
      { role: "user",   content: prompt.user },
    ]);

    let result;
    try {
      result = CompetitorAnalysisSchema.parse(JSON.parse(raw));
    } catch {
      const raw2 = await client.chat([
        { role: "system", content: prompt.system },
        { role: "user",   content: fixJsonPrompt(raw) },
      ]);
      result = CompetitorAnalysisSchema.parse(JSON.parse(raw2));
    }

    return NextResponse.json({ analysis: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Competitor analysis failed" },
      { status: 400 }
    );
  }
}
