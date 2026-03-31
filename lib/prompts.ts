import { Intake } from "./schemas";

export const SYSTEM_JSON_ONLY = `
You are an expert startup advisor focused on women entrepreneurship.
Return ONLY valid JSON. No markdown. No commentary. No extra keys.
If you are unsure, still return JSON that matches the schema exactly.
`;

export function visionPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "problem_statement": "string",\n  "target_customer": "string",\n  "value_proposition": "string",\n  "unique_angle": "string",\n  "core_features": ["string"],\n  "risks": ["string"],\n  "assumptions": ["string"]\n}`;
  const context = {
    startup_idea: intake.idea,
    industry: intake.industry,
    stage: intake.stage,
    location: intake.region,
    target_customer: intake.targetCustomer,
    biggest_challenge: intake.challenge || intake.constraints || "",
  };
  const constraints = `\n\nCONSTRAINTS:\n- Keep it concise and actionable.\n- Women-entrepreneurship aware, but not preachy.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function fundingPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "recommended_funding_path": "string",\n  "top_3_next_steps": ["string"],\n  "grants_and_programs": ["string"],\n  "accelerator_types": ["string"],\n  "bootstrap_strategy": "string",\n  "pitch_focus": ["string"],\n  "risks_and_mitigations": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Do NOT invent specific grant names with fake URLs.\n- Suggest categories and examples like: “women founder accelerators”, “state small business grants”, “university incubators”, “impact funds”.\n- Make it realistic for the stage.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function gtmPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "positioning_statement": "string",\n  "ideal_early_adopters": ["string"],\n  "validation_experiments": ["string"],\n  "first_10_customers_plan": ["string"],\n  "channels": ["string"],\n  "partnership_ideas": ["string"],\n  "success_metrics": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Make steps concrete and testable within 2 weeks.\n- Prefer community + partnerships + low-cost channels.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function roadmapPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "day_30": ["string"],\n  "day_60": ["string"],\n  "day_90": ["string"],\n  "milestones": ["string"],\n  "metrics_to_track": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Each list should be 4-7 items max.\n- Make it realistic for a small team.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function pitchPrompt(intake: Intake) {
  const schemaBlock = `Return JSON matching EXACTLY this schema:\n{\n  "one_sentence_vision": "string",\n  "elevator_pitch": "string",\n  "slides": [\n    { "title": "string", "bullets": ["string"] }\n  ],\n  "demo_script_30s": ["string"]\n}`;
  const context = { intake };
  const constraints = `\n\nCONSTRAINTS:\n- Slides must be 8 slides total:\n  1) Problem\n  2) Solution\n  3) Why Now\n  4) Market\n  5) Product\n  6) Go-To-Market\n  7) Business Model\n  8) Ask / Next Steps\n- Each slide 3-5 bullets.`;
  return {
    system: SYSTEM_JSON_ONLY,
    user: `${schemaBlock}\n\nCONTEXT:\n${JSON.stringify(context)}${constraints}`,
  };
}

export function refinePrompt(
  section: "blueprint" | "funding" | "gtm" | "roadmap" | "pitch",
  intake: Intake,
  currentOutput: object,
  feedback: string,
) {
  const schemaMap: Record<string, string> = {
    blueprint: `{"problem_statement":"string","target_customer":"string","value_proposition":"string","unique_angle":"string","core_features":["string"],"risks":["string"],"assumptions":["string"]}`,
    funding: `{"recommended_funding_path":"string","top_3_next_steps":["string"],"grants_and_programs":["string"],"accelerator_types":["string"],"bootstrap_strategy":"string","pitch_focus":["string"],"risks_and_mitigations":["string"]}`,
    gtm: `{"positioning_statement":"string","ideal_early_adopters":["string"],"validation_experiments":["string"],"first_10_customers_plan":["string"],"channels":["string"],"partnership_ideas":["string"],"success_metrics":["string"]}`,
    roadmap: `{"day_30":["string"],"day_60":["string"],"day_90":["string"],"milestones":["string"],"metrics_to_track":["string"]}`,
    pitch: `{"one_sentence_vision":"string","elevator_pitch":"string","slides":[{"title":"string","bullets":["string"]}],"demo_script_30s":["string"]}`,
  };
  return {
    system: SYSTEM_JSON_ONLY,
    user: `You are regenerating the ${section} section of a startup plan based on founder feedback.

FOUNDER CONTEXT:
${JSON.stringify(intake, null, 2)}

CURRENT OUTPUT (the version to improve):
${JSON.stringify(currentOutput, null, 2)}

FOUNDER FEEDBACK:
"${feedback}"

Regenerate the ${section} section incorporating the feedback above. Keep what was good; improve or replace what the founder flagged.
Return ONLY valid JSON matching EXACTLY this schema:
${schemaMap[section]}`,
  };
}

export function competitorPrompt(intake: Intake) {
  const schema = `{
  "direct_competitors": [
    {
      "name": "string",
      "description": "string",
      "target_market": "string",
      "your_edge_over_them": "string",
      "their_edge_over_you": "string"
    }
  ],
  "indirect_competitors": [
    {
      "name": "string",
      "description": "string",
      "target_market": "string",
      "your_edge_over_them": "string",
      "their_edge_over_you": "string"
    }
  ],
  "whitespace_opportunity": "string",
  "competitive_moat": "string",
  "watch_out_for": ["string"]
}`;
  return {
    system: `You are a competitive intelligence analyst. Return ONLY valid JSON — no markdown, no commentary.`,
    user: `Analyze the competitive landscape for this startup idea and return a structured analysis.

STARTUP IDEA: ${intake.idea}
INDUSTRY: ${intake.industry}
STAGE: ${intake.stage}
REGION: ${intake.region}
TARGET CUSTOMER: ${intake.targetCustomer}

Instructions:
- direct_competitors: 3–4 real companies that solve the same problem for the same customer
- indirect_competitors: 2–3 companies that solve it differently or partially
- For each competitor, be specific about their actual edge vs this founder's edge
- whitespace_opportunity: the specific market gap this founder can own
- competitive_moat: 1–2 durable advantages this founder can build
- watch_out_for: 3–4 concrete competitive risks (e.g., big players pivoting, pricing pressure)

Return ONLY valid JSON matching EXACTLY:
${schema}`,
  };
}

export function fixJsonPrompt(badText: string, schemaHint?: string) {
  const header = `The previous output was NOT valid JSON or didn't match the required schema.`;
  const schemaLine = schemaHint ? `\n\nReturn ONLY corrected valid JSON that matches EXACTLY this schema:\n${schemaHint}` : `\n\nReturn ONLY corrected valid JSON that matches the expected schema.`;
  const body = `\n\nBad output:\n${badText}`;
  return `${header}${schemaLine}${body}`;
}
