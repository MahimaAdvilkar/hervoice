import { NextResponse } from "next/server";
import { z } from "zod";
import { matchInvestors } from "@/lib/investors";

export const runtime = "nodejs";

const QuerySchema = z.object({
  region:   z.string().min(1),
  stage:    z.enum(["ideation", "prototype", "beta", "launched"]),
  industry: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { region, stage, industry } = QuerySchema.parse(body);
    const matches = matchInvestors(region, stage, industry, true);
    return NextResponse.json({ matches, count: matches.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Investor matching failed" },
      { status: 400 }
    );
  }
}
